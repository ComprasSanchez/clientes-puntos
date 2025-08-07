// src/infrastructure/cache/saldo/saldo-metricas-cache.service.ts

import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../redis/redis-cache.service';
import { MetricasSaldo } from 'src/context/Metricas/core/puntos/entities/MetricasSaldo';

@Injectable()
export class SaldoMetricasCacheService {
  private readonly SALDO_KEY = 'metricas:saldo:actual';

  constructor(private readonly redis: RedisCacheService) {}

  async getMetricasSaldo<T = MetricasSaldo>(): Promise<T | null> {
    return this.redis.getJSON<T>(this.SALDO_KEY);
  }

  async setMetricasSaldo<T = MetricasSaldo>(
    metricas: T,
    ttl = 300,
  ): Promise<void> {
    // Por default, TTL = 300 segundos (podés cambiarlo según tu necesidad)
    await this.redis.setJSON(this.SALDO_KEY, metricas, ttl);
  }

  async invalidate(): Promise<void> {
    await this.redis.del(this.SALDO_KEY);
  }
}
