import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  Inject,
} from '@nestjs/common';
import { CargarMetricasSaldo } from 'src/context/Metricas/application/puntos/use-cases/CargarMetricasSaldo';
import { MetricasSaldo } from 'src/context/Metricas/core/puntos/entities/MetricasSaldo';
import { SaldoMetricasCacheService } from './saldo-cache.service';
import { CARGAR_METRICA_SALDO_USECASE } from 'src/context/Metricas/core/puntos/tokens/tokens';

@Injectable()
export class SaldoMetricasCacheLoader implements OnApplicationBootstrap {
  private readonly logger = new Logger(SaldoMetricasCacheLoader.name);

  constructor(
    @Inject(SaldoMetricasCacheService)
    private readonly saldoCache: SaldoMetricasCacheService,
    @Inject(CARGAR_METRICA_SALDO_USECASE)
    private readonly cargarMetricasSaldo: CargarMetricasSaldo,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.loadAndCacheMetricasSaldo();
      this.logger.log(`Cache de métricas de saldo inicializado.`);
    } catch (e) {
      this.logger.error(
        'Error cacheando métricas de saldo al iniciar la app',
        e as Error,
      );
    }
  }

  /**
   * Fuerza el recálculo y actualización del cache en Redis
   */
  async loadAndCacheMetricasSaldo(): Promise<MetricasSaldo> {
    const metricas = await this.cargarMetricasSaldo.run();
    await this.saldoCache.setMetricasSaldo(metricas); // TTL configurable
    return metricas;
  }

  /**
   * Devuelve las métricas cacheadas; si no hay, las recalcula y las cachea
   */
  async getMetricasSaldo(): Promise<MetricasSaldo> {
    let metricas = await this.saldoCache.getMetricasSaldo<MetricasSaldo>();
    if (!metricas) {
      metricas = await this.loadAndCacheMetricasSaldo();
    }
    return metricas;
  }

  async invalidate(): Promise<void> {
    await this.saldoCache.invalidate();
  }
}
