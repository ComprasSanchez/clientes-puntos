// src/application/use-cases/GetMetricasSaldo.ts

import { SaldoMetricasCacheLoader } from '@infrastructure/cache/saldo-cache/saldo-cache.loader';
import { Inject, Injectable } from '@nestjs/common';
import { MetricasSaldo } from 'src/context/Metricas/core/puntos/entities/MetricasSaldo';

@Injectable()
export class GetMetricasSaldo {
  constructor(
    @Inject(SaldoMetricasCacheLoader)
    private readonly loader: SaldoMetricasCacheLoader,
  ) {}

  async run(): Promise<MetricasSaldo> {
    // Trae la métrica de saldo desde cache, o la recalcula si no existe
    return await this.loader.getMetricasSaldo();
  }
}
