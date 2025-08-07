import { Injectable, Inject } from '@nestjs/common';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { OPERACION_REPO, TX_REPO } from '@puntos/core/tokens/tokens';
import { FechaOperacion } from '@puntos/core/value-objects/FechaOperacion';
import { MetricasOperacionRepository } from 'src/context/Metricas/core/puntos/repositories/MetricasOperacionRepository';
import { CalcularMetricasOperacionService } from 'src/context/Metricas/core/puntos/services/calcularMetricasOperacionService';
import { METRICA_OPERACION_REPO } from 'src/context/Metricas/core/puntos/tokens/tokens';

@Injectable()
export class GuardarMetricasOperacion {
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

  async run(fecha: Date): Promise<void> {
    const ops = await this.operacionRepo.findByFecha(new FechaOperacion(fecha));
    const transacciones = await this.transaccionRepo.findByFecha(fecha);
    const calc = this.calc.calcular(ops, transacciones, fecha);
    await this.metricasRepo.save(calc);
  }
}
