import { forwardRef, Module } from '@nestjs/common';
import { ClienteMetricaEntity } from './clientes/entities/ClienteMetrica.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteMetricaRepositoryImpl } from './clientes/repositories/ClienteMetricaRepositoryImpl';
import { METRICAS_REPO } from '../core/clientes/tokens/tokens';
import { RuleCotizacionFinderAdapter } from './reglas/adapters/ReglaCotizacionFinderAdapter';
import {
  CALCULAR_METRICAS_SERVICE,
  CALCULAR_SALDO_METRICAS_SERVICE,
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
import {
  CARGAR_METRICA_SALDO_USECASE,
  GET_METRICA_SALDO_USECASE,
  METRICA_OPERACION_REPO,
} from '../core/puntos/tokens/tokens';
import { MetricasOperacionTypeOrmRepository } from './puntos/repositories/MetricasOperacionTypeOrmImpl';
import { GuardarMetricasOperacion } from '../application/puntos/use-cases/GuardarMetricasOperacion';
import { CalcularMetricasOperacionService } from '../core/puntos/services/calcularMetricasOperacionService';
import { MetricasCronLogEntity } from './MetricasScheduler/persistence/entities/MetricasCronLogEntity';
import { CRON_LOG_REPO } from './MetricasScheduler/tokens';
import { MetricasCronLogTypeOrmRepository } from './MetricasScheduler/persistence/repositories/CronLogTypeOrmImpl';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricasOperacionScheduler } from './MetricasScheduler/MetricasOperacion.scheduler';
import { SaldoCacheModule } from '@infrastructure/cache/saldo-cache/saldo-cache.module';
import { CalcularMetricasSaldoService } from '../core/puntos/services/calcularMetricasSaldoService';
import { CargarMetricasSaldo } from '../application/puntos/use-cases/CargarMetricasSaldo';
import { GetMetricasSaldo } from '../application/puntos/use-cases/GetMetricasSaldo';
import { ClienteInfrastructureModule } from '@cliente/infrastructure/cliente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MetricasCronLogEntity,
      ClienteMetricaEntity,
      MetricasOperacionEntity,
    ]),
    ScheduleModule.forRoot(),
    forwardRef(() => ClienteInfrastructureModule),
    forwardRef(() => PuntosInfrastructureModule),
    forwardRef(() => ReglaInfrastructureModule),
    forwardRef(() => RulesCacheModule),
    forwardRef(() => SaldoCacheModule),
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
      provide: CRON_LOG_REPO,
      useClass: MetricasCronLogTypeOrmRepository,
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
      provide: CARGAR_METRICA_SALDO_USECASE,
      useClass: CargarMetricasSaldo,
    },
    {
      provide: GET_METRICA_SALDO_USECASE,
      useClass: GetMetricasSaldo,
    },
    {
      provide: CALCULAR_METRICAS_SERVICE,
      useClass: CalcularMetricasClienteService,
    },
    {
      provide: CALCULAR_SALDO_METRICAS_SERVICE,
      useClass: CalcularMetricasSaldoService,
    },
    MetricasOperacionScheduler,
  ],
  exports: [
    METRICAS_REPO,
    METRICA_OPERACION_REPO,
    CRON_LOG_REPO,
    TypeOrmModule,
    RULE_COTIZACION_FINDER,
    CREAR_METRICA_CLIENTE_USECASE,
    GET_METRICAS_CLIENTE_USECASE,
    GET_METRICA_SALDO_USECASE,
    CARGAR_METRICA_SALDO_USECASE,
  ],
})
export class MetricasModule {}
