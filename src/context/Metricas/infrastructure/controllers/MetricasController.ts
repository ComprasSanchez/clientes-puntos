// src/infrastructure/controllers/metricas.controller.ts
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Query,
} from '@nestjs/common';
import { GetMetricasSaldo } from '../../application/puntos/use-cases/GetMetricasSaldo';
import { MetricasSaldo } from '../../core/puntos/entities/MetricasSaldo';
import { GET_METRICA_SALDO_USECASE } from '../../core/puntos/tokens/tokens';
import { ClientPerms } from '@sistemas-fsa/authz/nest';
import { GetClienteMetricasDashboard } from '../../application/clientes/services/GetClientesMetricasDashboard';
import { GET_CLIENTE_METRICAS_DASHBOARD_CLIENTE } from '../../core/reglas/tokens/tokens';
import { ClienteMetricasDashboardDto } from '../../application/clientes/dto/ClienteMetricasDTO';

@Controller('metricas')
export class MetricasController {
  constructor(
    @Inject(GET_METRICA_SALDO_USECASE)
    private readonly getMetricasSaldo: GetMetricasSaldo,
    @Inject(GET_CLIENTE_METRICAS_DASHBOARD_CLIENTE)
    private readonly getClienteMetricasDashboard: GetClienteMetricasDashboard,
  ) {}

  /**
   * GET /metricas/saldo
   * Devuelve las métricas actuales de saldo (cacheadas o calculadas)
   */
  @ClientPerms('metricas:read')
  @Get('saldo')
  async getSaldo(): Promise<MetricasSaldo> {
    try {
      return await this.getMetricasSaldo.run();
    } catch (e) {
      throw new HttpException(
        'No se pudieron obtener las métricas de saldo',
        HttpStatus.INTERNAL_SERVER_ERROR,
        e as Error,
      );
    }
  }

  /**
   * GET /metricas/clientes/:clienteId/dashboard
   * Query: desde, hasta (ISO). Si no se envían, por defecto 1 año.
   */
  @ClientPerms('metricas:read')
  @Get('clientes/:clienteId/dashboard')
  async getClienteDashboard(
    @Param('clienteId') clienteId: string,
    @Query('desde') desdeStr?: string,
    @Query('hasta') hastaStr?: string,
  ): Promise<ClienteMetricasDashboardDto> {
    try {
      const hasta = hastaStr ? new Date(hastaStr) : new Date();
      if (isNaN(hasta.getTime())) {
        throw new HttpException(
          'Parámetro "hasta" inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const desde = desdeStr
        ? new Date(desdeStr)
        : (() => {
            const d = new Date(hasta);
            d.setFullYear(d.getFullYear() - 1);
            return d;
          })();

      if (isNaN(desde.getTime())) {
        throw new HttpException(
          'Parámetro "desde" inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.getClienteMetricasDashboard.run(
        clienteId,
        desde,
        hasta,
      );
    } catch (e) {
      if (e instanceof HttpException) throw e;

      throw new HttpException(
        {
          message: 'No se pudo obtener el dashboard de métricas del cliente',
          error: (e as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: e as Error },
      );
    }
  }
}
