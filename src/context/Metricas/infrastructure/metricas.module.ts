import { Module } from '@nestjs/common';
import { ClienteMetricaEntity } from './clientes/entities/ClienteMetrica.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteMetricaRepositoryImpl } from './clientes/repositories/ClienteMetricaRepositoryImpl';
import { METRICAS_REPO } from '../core/clientes/tokens/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClienteMetricaEntity]),
    // otros módulos si necesitas inyectar repos de cliente, reglas, etc.
  ],
  controllers: [],
  providers: [
    // Repositorios (puerto e implementación)
    {
      provide: METRICAS_REPO,
      useClass: ClienteMetricaRepositoryImpl,
    },
    // Si tu UUIDGen es un servicio de shared, también lo podés inyectar acá:
    // UUIDGen,
  ],
  exports: [METRICAS_REPO, TypeOrmModule],
})
export class MetricasModule {}
