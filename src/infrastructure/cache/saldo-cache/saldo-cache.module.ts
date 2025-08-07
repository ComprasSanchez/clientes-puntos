import { forwardRef, Module } from '@nestjs/common';
import { RedisCacheModule } from '../redis/redis-cache.module';
import { MetricasModule } from 'src/context/Metricas/infrastructure/metricas.module';
import { SaldoMetricasCacheService } from './saldo-cache.service';
import { SaldoMetricasCacheLoader } from './saldo-cache.loader';

@Module({
  imports: [RedisCacheModule, forwardRef(() => MetricasModule)],
  providers: [SaldoMetricasCacheService, SaldoMetricasCacheLoader],
  exports: [SaldoMetricasCacheService, SaldoMetricasCacheLoader],
})
export class SaldoCacheModule {}
