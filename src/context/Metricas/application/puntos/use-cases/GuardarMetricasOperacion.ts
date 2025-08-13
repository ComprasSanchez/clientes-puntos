import { Injectable, Inject, Logger } from '@nestjs/common';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { OPERACION_REPO, TX_REPO } from '@puntos/core/tokens/tokens';
import { MetricasOperacionRepository } from 'src/context/Metricas/core/puntos/repositories/MetricasOperacionRepository';
import { CalcularMetricasOperacionService } from 'src/context/Metricas/core/puntos/services/calcularMetricasOperacionService';
import { METRICA_OPERACION_REPO } from 'src/context/Metricas/core/puntos/tokens/tokens';
import { FechaDiaRange } from '../value-objects/FechaDiaRange';

@Injectable()
export class GuardarMetricasOperacion {
  private readonly logger = new Logger(GuardarMetricasOperacion.name);

  constructor(
    @Inject(METRICA_OPERACION_REPO)
    private readonly metricasRepo: MetricasOperacionRepository,
    @Inject(OPERACION_REPO)
    private readonly operacionRepo: OperacionRepository,
    @Inject(TX_REPO)
    private readonly transaccionRepo: TransaccionRepository,
    @Inject(CalcularMetricasOperacionService)
    private readonly calc: CalcularMetricasOperacionService,
  ) {}

  async run(diaUtc: FechaDiaRange): Promise<void> {
    const [ops, txs] = await Promise.all([
      this.operacionRepo.findBetween(diaUtc.startUtc, diaUtc.endUtc),
      this.transaccionRepo.findBetween(diaUtc.startUtc, diaUtc.endUtc),
    ]);

    const metricas = this.calc.calcular(ops, txs, diaUtc.startUtc);
    await this.metricasRepo.save(metricas);
  }
}
