import { forwardRef, Module } from '@nestjs/common';
import { ClienteMetricaEntity } from './clientes/entities/ClienteMetrica.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteMetricaRepositoryImpl } from './clientes/repositories/ClienteMetricaRepositoryImpl';
import { METRICAS_REPO } from '../core/clientes/tokens/tokens';
import { RuleCotizacionFinderAdapter } from './reglas/adapters/ReglaCotizacionFinderAdapter';
import {
  CLIENTE_CALCULATOR,
  CREAR_METRICA_CLIENTE_SERVICE,
  CREAR_METRICA_CLIENTE_USECASE,
  RULE_COTIZACION_FINDER,
} from '../core/reglas/tokens/tokens';
import { ClienteMetricsCalculator } from '../core/clientes/services/ClienteMetricsClaculator';
import { CrearClienteMetricaService } from '../application/clientes/services/CrearMetricaClienteService';
import { ReglaInfrastructureModule } from '@regla/infrastructure/regla.module';
import { RulesCacheModule } from '@infrastructure/cache/rules-cache/rules-cache.module';
import { ReglaFindCotizacion } from '@regla/application/use-cases/ReglaFindCotizacion/FindCotizacion';
import { CrearMetricaClienteuseCase } from '../application/clientes/use-cases/CrearMetricaCliente';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClienteMetricaEntity]),
    forwardRef(() => ReglaInfrastructureModule),
    forwardRef(() => RulesCacheModule),
  ],
  controllers: [],
  providers: [
    ReglaFindCotizacion,
    { provide: RULE_COTIZACION_FINDER, useClass: RuleCotizacionFinderAdapter },
    {
      provide: METRICAS_REPO,
      useClass: ClienteMetricaRepositoryImpl,
    },
    {
      provide: CLIENTE_CALCULATOR,
      useValue: ClienteMetricsCalculator,
    },
    {
      provide: CREAR_METRICA_CLIENTE_SERVICE,
      useClass: CrearClienteMetricaService,
    },
    {
      provide: CREAR_METRICA_CLIENTE_USECASE,
      useClass: CrearMetricaClienteuseCase,
    },
  ],
  exports: [
    METRICAS_REPO,
    TypeOrmModule,
    RULE_COTIZACION_FINDER,
    CREAR_METRICA_CLIENTE_USECASE,
  ],
})
export class MetricasModule {}
