import {
  BadGatewayException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { ClientPerms } from '@sistemas-fsa/authz/nest';
import { UserId } from '@shared/infrastructure/decorators/user-id.decorator';
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { PuntosServiceWIBI } from '../adapters/PuntosServiceWIBI/PuntosServiceWIBI';

type PuntosMeSaldoResponse = {
  clienteId: string;
  nroTarjeta: string;
  saldoActual: number;
};

@ApiTags('Puntos - Me')
@ApiBearerAuth()
@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff', 'sociosa'],
  requireSucursalData: false,
})
@Controller('puntos/me')
export class PuntosMeController {
  constructor(
    private readonly clientesFsaClient: ClientesFsaClient,
    private readonly wibiService: PuntosServiceWIBI,
    @Inject(CLIENTE_REPO)
    private readonly clienteRepo: ClienteRepository,
  ) {}

  @Get()
  @ClientPerms('me:read')
  @ApiOperation({
    summary:
      'Obtiene saldo actual del cliente autenticado consultando directamente a WIBI',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string' },
        nroTarjeta: { type: 'string' },
        saldoActual: { type: 'number' },
      },
    },
  })
  async getSaldoActual(
    @UserId() userId: string,
    @Query('clienteId') clienteId?: string,
  ): Promise<PuntosMeSaldoResponse> {
    let puntosClienteId = String(clienteId ?? '').trim();

    if (!puntosClienteId) {
      if (!userId) {
        throw new NotFoundException('Usuario autenticado sin subject');
      }

      const clienteFsaMe = await this.clientesFsaClient.findMe();
      if (!clienteFsaMe) {
        throw new NotFoundException('No se pudo resolver el perfil del cliente');
      }

      puntosClienteId = this.extractPuntosClienteId(clienteFsaMe.fuentesDatos) ?? '';

      if (!puntosClienteId) {
        const fallback = await this.findPuntosClienteByDni(
          clienteFsaMe.documento?.numero,
        );
        puntosClienteId = fallback?.clienteId ?? '';

        if (puntosClienteId && fallback?.dniForSync) {
          await this.syncFuenteDatosPuntos({
            puntosId: puntosClienteId,
            dni: fallback.dniForSync,
          });
        }
      }

      if (!puntosClienteId) {
        throw new NotFoundException(
          'No se pudo resolver cliente de PUNTOS ni por fuenteDatos ni por DNI',
        );
      }
    }

    let cliente = await this.clienteRepo.findById(new ClienteId(puntosClienteId));

    if (!cliente) {
      const dniFromClientesFsa = await this.findDniByClientesFsaId(puntosClienteId);

      if (dniFromClientesFsa) {
        const fallbackByDni = await this.findPuntosClienteByDni(dniFromClientesFsa);

        if (fallbackByDni?.clienteId) {
          puntosClienteId = fallbackByDni.clienteId;
          cliente = await this.clienteRepo.findById(new ClienteId(puntosClienteId));

          if (fallbackByDni.dniForSync) {
            await this.syncFuenteDatosPuntos({
              puntosId: puntosClienteId,
              dni: fallbackByDni.dniForSync,
            });
          }
        }
      }
    }

    if (!cliente) {
      throw new NotFoundException(
        `No existe cliente en Puntos para id ${puntosClienteId}`,
      );
    }

    const nroTarjeta = String(cliente.fidelyStatus.tarjetaFidely.value ?? '').trim();
    if (!nroTarjeta) {
      throw new NotFoundException(
        `El cliente ${puntosClienteId} no posee NroTarjeta para consulta WIBI`,
      );
    }

    try {
      const saldoActual = await this.wibiService.obtenerSaldoActualByTarjeta(
        nroTarjeta,
      );

      return {
        clienteId: puntosClienteId,
        nroTarjeta,
        saldoActual,
      };
    } catch (error) {
      throw new BadGatewayException(
        error instanceof Error
          ? `Falló consulta de saldo WIBI: ${error.message}`
          : 'Falló consulta de saldo WIBI',
      );
    }
  }

  private extractPuntosClienteId(
    fuentesDatos?: Array<{ sistema?: string; extId?: string }> | null,
  ): string | null {
    const found = (fuentesDatos ?? []).find(
      (item) => String(item?.sistema ?? '').toUpperCase() === 'PUNTOS',
    );

    const extId = String(found?.extId ?? '').trim();
    return extId || null;
  }

  private async findPuntosClienteByDni(
    input?: string | null,
  ): Promise<{ clienteId: string; dniForSync: string } | null> {
    const candidates = this.resolveDniCandidates(input);

    for (const dni of candidates) {
      try {
        const cliente = await this.clienteRepo.findByDni(new ClienteDni(dni));
        if (!cliente) {
          continue;
        }

        return {
          clienteId: cliente.id.value,
          dniForSync: this.normalizeDniForClientesFsa(dni),
        };
      } catch {
        continue;
      }
    }

    return null;
  }

  private resolveDniCandidates(input?: string | null): string[] {
    const onlyDigits = String(input ?? '').replace(/\D/g, '');
    if (!onlyDigits) return [];

    const candidates = new Set<string>();

    if (this.isValidDniLength(onlyDigits)) {
      candidates.add(onlyDigits);
    }

    const withoutLeadingZeros = onlyDigits.replace(/^0+/, '');
    if (this.isValidDniLength(withoutLeadingZeros)) {
      candidates.add(withoutLeadingZeros);

      // En Puntos algunos DNIs se persisten con left-pad a 10 dígitos
      // (ej: 40772342 -> 0040772342). Agregamos candidato padded
      // para evitar miss por match exacto en repositorio.
      const paddedTo10 = withoutLeadingZeros.padStart(10, '0');
      if (this.isValidDniLength(paddedTo10)) {
        candidates.add(paddedTo10);
      }
    }

    return Array.from(candidates);
  }

  private normalizeDniForClientesFsa(dni: string): string {
    const normalized = dni.replace(/^0+/, '');
    return this.isValidDniLength(normalized) ? normalized : dni;
  }

  private isValidDniLength(dni: string): boolean {
    return dni.length >= 6 && dni.length <= 10;
  }

  private async syncFuenteDatosPuntos(payload: {
    puntosId: string;
    dni: string;
  }): Promise<void> {
    try {
      await this.clientesFsaClient.syncFromPuntos(payload);
    } catch {
      // Best effort: no bloquear saldo por fallo de autovinculación.
    }
  }

  private async findDniByClientesFsaId(id: string): Promise<string | null> {
    try {
      const clienteFsa = await this.clientesFsaClient.findById(id);
      if (!clienteFsa) return null;

      const dni = String(
        clienteFsa.nnro_documento ??
          clienteFsa.nro_documento ??
          clienteFsa.documento?.numero ??
          '',
      )
        .replace(/\D/g, '')
        .trim();

      return dni || null;
    } catch {
      return null;
    }
  }
}
