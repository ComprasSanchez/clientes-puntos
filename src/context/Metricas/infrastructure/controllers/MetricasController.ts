// src/infrastructure/controllers/metricas.controller.ts

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { GetMetricasSaldo } from '../../application/puntos/use-cases/GetMetricasSaldo';
import { MetricasSaldo } from '../../core/puntos/entities/MetricasSaldo';
import { GET_METRICA_SALDO_USECASE } from '../../core/puntos/tokens/tokens';

@Controller('metricas')
export class MetricasController {
  constructor(
    @Inject(GET_METRICA_SALDO_USECASE)
    private readonly getMetricasSaldo: GetMetricasSaldo,
  ) {}

  /**
   * GET /metricas/saldo
   * Devuelve las métricas actuales de saldo (cacheadas o calculadas)
   */
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
}
