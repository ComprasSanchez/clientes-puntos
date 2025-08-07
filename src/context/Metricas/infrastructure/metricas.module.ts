import { forwardRef, Module } from '@nestjs/common';
import { ClienteMetricaEntity } from './clientes/entities/ClienteMetrica.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteMetricaRepositoryImpl } from './clientes/repositories/ClienteMetricaRepositoryImpl';
import { METRICAS_REPO } from '../core/clientes/tokens/tokens';
import { RuleCotizacionFinderAdapter } from './reglas/adapters/ReglaCotizacionFinderAdapter';
import {
  CALCULAR_METRICAS_SERVICE,
  CLIENTE_CALCULATOR,
  CREAR_METRICA_CLIENTE_SERVICE,
  CREAR_METRICA_CLIENTE_USECASE,
  GET_METRICAS_CLIENTE_USECASE,
  RULE_COTIZACION_FINDER,
} from '../core/reglas/tokens/tokens';
import { ClienteMetricsCalculator } from '../core/clientes/services/ClienteMetricsClaculator';
import { CrearClienteMetricaService } from '../application/clientes/services/CrearMetricaClienteService';
import { ReglaInfrastructureModule } from '@regla/infrastructure/regla.module';
import { RulesCacheModule } from '@infrastructure/cache/rules-cache/rules-cache.module';
import { ReglaFindCotizacion } from '@regla/application/use-cases/ReglaFindCotizacion/FindCotizacion';
import { CrearMetricaClienteuseCase } from '../application/clientes/use-cases/CrearMetricaCliente';
import { GetMetricasCliente } from '../application/clientes/use-cases/GetMetricasCliente';
import { CalcularMetricasClienteService } from '../application/clientes/services/CalcularMetricasCLienteService';
import { MetricasOperacionEntity } from './puntos/entities/MetricasOperacionEntity';
import { PuntosInfrastructureModule } from '@puntos/infrastructure/puntos.module';
import { METRICA_OPERACION_REPO } from '../core/puntos/tokens/tokens';
import { MetricasOperacionTypeOrmRepository } from './puntos/repositories/MetricasOperacionTypeOrmImpl';
import { GuardarMetricasOperacion } from '../application/puntos/use-cases/GuardarMetricasOperacion';
import { CalcularMetricasOperacionService } from '../core/puntos/services/calcularMetricasOperacionService';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClienteMetricaEntity, MetricasOperacionEntity]),
    forwardRef(() => PuntosInfrastructureModule),
    forwardRef(() => ReglaInfrastructureModule),
    forwardRef(() => RulesCacheModule),
  ],
  controllers: [],
  providers: [
    GuardarMetricasOperacion,
    ReglaFindCotizacion,
    { provide: RULE_COTIZACION_FINDER, useClass: RuleCotizacionFinderAdapter },
    {
      provide: METRICAS_REPO,
      useClass: ClienteMetricaRepositoryImpl,
    },
    {
      provide: METRICA_OPERACION_REPO,
      useClass: MetricasOperacionTypeOrmRepository,
    },
    {
      provide: CLIENTE_CALCULATOR,
      useValue: ClienteMetricsCalculator,
    },
    {
      provide: CalcularMetricasOperacionService,
      useFactory: () => new CalcularMetricasOperacionService(),
    },
    {
      provide: CREAR_METRICA_CLIENTE_SERVICE,
      useClass: CrearClienteMetricaService,
    },
    {
      provide: CREAR_METRICA_CLIENTE_USECASE,
      useClass: CrearMetricaClienteuseCase,
    },
    {
      provide: GET_METRICAS_CLIENTE_USECASE,
      useClass: GetMetricasCliente,
    },
    {
      provide: CALCULAR_METRICAS_SERVICE,
      useClass: CalcularMetricasClienteService,
    },
  ],
  exports: [
    METRICAS_REPO,
    METRICA_OPERACION_REPO,
    TypeOrmModule,
    RULE_COTIZACION_FINDER,
    CREAR_METRICA_CLIENTE_USECASE,
    GET_METRICAS_CLIENTE_USECASE,
  ],
})
export class MetricasModule {}
