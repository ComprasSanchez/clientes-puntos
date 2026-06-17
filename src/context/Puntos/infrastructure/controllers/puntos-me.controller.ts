import {
  // BadGatewayException, // [WIBI] Se usaba para errores de consulta a WIBI
  Controller,
  Get,
  Inject,
  Logger,
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
import { FindOperacionesByClienteUseCase } from '@puntos/application/use-cases/OperacionFindbyCliente/OperacionFindByCliente';
import { OperacionResponseDto } from '../dtos/OperacionResponseDto';
import { PaginationQueryDto } from '@shared/infrastructure/dtos/pagination-query.dto';
import { OperacionValorService } from '@puntos/application/services/OperacionValorService';
import { OBTENER_HSITORIAL_SALDO, OBTENER_SALDO_SERVICE, OPERACION_VALOR_SERVICE } from '@puntos/core/tokens/tokens';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
// [WIBI] import { PuntosServiceWIBI } from '../adapters/PuntosServiceWIBI/PuntosServiceWIBI';
import {
  GetHistorialSaldoCliente,
  HistorialSaldoPageResponse,
} from '@puntos/application/use-cases/ObtenerHistorialSaldo/GetHistorialSaldoCliente';

type PuntosMeSaldoResponse = {
  clienteId: string;
  nroTarjeta: string;
  saldoActual: number;
  movimientos: {
    items: OperacionResponseDto[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  };
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
  private readonly logger = new Logger(PuntosMeController.name);

  constructor(
    private readonly clientesFsaClient: ClientesFsaClient,
    // [WIBI] private readonly wibiService: PuntosServiceWIBI,
    @Inject(OBTENER_SALDO_SERVICE)
    private readonly obtenerSaldo: ObtenerSaldo,
    private readonly findByCliente: FindOperacionesByClienteUseCase,
    @Inject(OPERACION_VALOR_SERVICE)
    private readonly operacionValorService: OperacionValorService,
    @Inject(CLIENTE_REPO)
    private readonly clienteRepo: ClienteRepository,
    @Inject(OBTENER_HSITORIAL_SALDO)
    private readonly historialSaldo: GetHistorialSaldoCliente,
  ) {}

  @Get()
  @ClientPerms('me:read')
  @ApiOperation({
    summary:
      'Obtiene saldo actual del cliente autenticado desde la base de datos local (tabla saldo_cliente)',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string' },
        nroTarjeta: { type: 'string' },
        saldoActual: { type: 'number' },
        movimientos: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object' } },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            hasNext: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getSaldoActual(
    @UserId() userId: string,
    @Query() query: PaginationQueryDto,
    @Query('clienteId') clienteId?: string,
  ): Promise<PuntosMeSaldoResponse> {
    this.logger.log({
      msg: 'Inicio GET /puntos/me',
      userId: userId ?? null,
      clienteIdQuery: clienteId ?? null,
      page: query.page,
      limit: query.limit,
    });

    let puntosClienteId = await this.resolvePuntosClienteId(userId, clienteId);

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
    // [WIBI] Se eliminó el throw si nroTarjeta está vacío — ya no se necesita para consultar saldo.
    // [WIBI] if (!nroTarjeta) { throw new NotFoundException(`El cliente ${puntosClienteId} no posee NroTarjeta para consulta WIBI`); }

    // Saldo desde base de datos local (tabla saldo_cliente)
    const saldoActual = await this.obtenerSaldo.run(puntosClienteId);
    // [WIBI] const saldoActual = await this.resolveSaldoActual(nroTarjeta);

    const movimientos = await this.resolveMovimientos(puntosClienteId, query);

    this.logger.log({
      msg: 'GET /puntos/me resuelto',
      puntosClienteId,
      saldoActual,
      movimientosCount: movimientos.items.length,
      totalMovimientos: movimientos.total,
      page: movimientos.page,
      limit: movimientos.limit,
      hasNext: movimientos.hasNext,
    });

    return {
      clienteId: puntosClienteId,
      nroTarjeta,
      saldoActual,
      movimientos,
    };
  }

  @Get('historial-saldo')
  @ClientPerms('me:read')
  @ApiOperation({ summary: 'Historial de cambios de saldo del cliente (tabla historial_saldo_cliente, paginado)' })
  async getHistorialSaldo(
    @UserId() userId: string,
    @Query() query: PaginationQueryDto,
    @Query('clienteId') clienteId?: string,
  ): Promise<HistorialSaldoPageResponse> {
    this.logger.log({
      msg: 'Inicio GET /puntos/me/historial-saldo',
      userId: userId ?? null,
      clienteIdQuery: clienteId ?? null,
      page: query.page,
      limit: query.limit,
    });

    const puntosClienteId = await this.resolvePuntosClienteId(userId, clienteId);
    return this.historialSaldo.runPaginated(puntosClienteId, query.toParams());
  }

  private async resolvePuntosClienteId(
    userId: string,
    clienteIdQuery?: string,
  ): Promise<string> {
    let puntosClienteId = String(clienteIdQuery ?? '').trim();

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

      this.logger.log({
        msg: 'Cliente PUNTOS resuelto por /clientes/me o fallback DNI',
        userId,
        puntosClienteId,
      });
    }

    return puntosClienteId;
  }

  private async resolveMovimientos(
    puntosClienteId: string,
    query: PaginationQueryDto,
  ): Promise<PuntosMeSaldoResponse['movimientos']> {
    try {
      const pageResult = await this.findByCliente.run(
        puntosClienteId,
        query.toParams(),
      );
      const valorMap =
        await this.operacionValorService.calcularParaOperaciones(pageResult.items);

      const items = pageResult.items.map((op) => {
        const dto = OperacionResponseDto.fromDomain(op);
        const valor = valorMap.get(op.id.value);

        if (valor) {
          dto.puntosCredito = valor.puntosCredito;
          dto.puntosDebito = valor.puntosDebito;
          dto.puntosDelta = valor.puntosDelta;
        }

        return dto;
      });

      const hasNext =
        pageResult.total > 0 &&
        pageResult.page < Math.ceil(pageResult.total / pageResult.limit);

      return {
        items,
        total: pageResult.total,
        page: pageResult.page,
        limit: pageResult.limit,
        hasNext,
      };
    } catch (error) {
      this.logger.warn({
        msg: 'No se pudieron resolver movimientos en /puntos/me',
        puntosClienteId,
        reason: error instanceof Error ? error.message : 'unknown_error',
      });

      return {
        items: [],
        total: 0,
        page: query.page,
        limit: query.limit,
        hasNext: false,
      };
    }
  }

  // [WIBI] Método comentado — saldo ahora se lee de saldo_cliente (local).
  // [WIBI] Para revertir: ver docs/wibi-saldo-revert.md
  // private async resolveSaldoActual(nroTarjeta: string): Promise<number> {
  //   try {
  //     return await this.wibiService.obtenerSaldoActualByTarjeta(nroTarjeta);
  //   } catch (error) {
  //     this.logger.error({
  //       msg: 'Error obteniendo saldo WIBI en /puntos/me',
  //       nroTarjeta,
  //       reason: error instanceof Error ? error.message : 'unknown_error',
  //     });
  //     throw new BadGatewayException(
  //       error instanceof Error
  //         ? `Falló consulta de saldo WIBI: ${error.message}`
  //         : 'Falló consulta de saldo WIBI',
  //     );
  //   }
  // }

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
    if (candidates.length === 0) {
      return null;
    }

    // Usar el método optimizado que busca todos los candidatos en una sola query
    const cliente = await this.clienteRepo.findByDNICandidates(candidates);

    if (!cliente) {
      return null;
    }

    // Retornar el primer candidato que matcheó como dniForSync
    return {
      clienteId: cliente.id.value,
      dniForSync: this.normalizeDniForClientesFsa(candidates[0]),
    };
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
