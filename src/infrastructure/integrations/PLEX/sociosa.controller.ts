import {
  BadGatewayException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OBTENER_SALDO_SERVICE } from '@puntos/core/tokens/tokens';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { ClientesFsaClient } from '../CLIENTES/services/clientes-fsa.client';
import { ApiJwtGuard } from '@infrastructure/auth/api-jwt.guard';
import { Authz } from '@infrastructure/auth/authz-policy.decorator';

type SociosaPuntosResponse = {
  plexId: string;
  clienteId: string;
  puntosActuales: number;
};

@ApiTags('Integraciones - PLEX')
@ApiBearerAuth()
@UseGuards(ApiJwtGuard)
@Authz({
  allowedAzp: ['puntos-fsa', 'bff'],
  requireSucursalData: false,
})
@Controller('integrations/plex/sociosa')
export class SociosaController {
  constructor(
    private readonly clientesFsaClient: ClientesFsaClient,
    @Inject(OBTENER_SALDO_SERVICE)
    private readonly obtenerSaldo: ObtenerSaldo,
  ) {}

  @Get('puntos-actuales/:plexId')
  @ApiOperation({
    summary: 'Obtiene puntos actuales por PlexId para Sociosa',
  })
  @ApiParam({ name: 'plexId', type: String })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        plexId: { type: 'string' },
        clienteId: { type: 'string' },
        puntosActuales: { type: 'number' },
      },
    },
  })
  async getPuntosActuales(
    @Param('plexId') rawPlexId: string,
  ): Promise<SociosaPuntosResponse> {
    const plexId = String(rawPlexId ?? '').trim();
    if (!plexId) {
      throw new NotFoundException('PlexId requerido');
    }

    let cliente: { id: string } | null;
    try {
      cliente = await this.clientesFsaClient.findByExternalId('PLEX', plexId);
    } catch {
      throw new BadGatewayException(
        'No se pudo resolver el cliente desde clientes-fsa por PlexId',
      );
    }

    if (!cliente?.id) {
      throw new NotFoundException(
        `No existe cliente asociado a PlexId ${plexId}`,
      );
    }

    const puntosActuales = await this.obtenerSaldo.run(cliente.id);

    return {
      plexId,
      clienteId: cliente.id,
      puntosActuales,
    };
  }
}
