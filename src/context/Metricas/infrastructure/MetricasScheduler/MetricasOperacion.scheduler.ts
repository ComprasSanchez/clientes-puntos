import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuardarMetricasOperacion } from '../../application/puntos/use-cases/GuardarMetricasOperacion';
import { CRON_LOG_REPO } from './tokens';
import { MetricasCronLogTypeOrmRepository } from './persistence/repositories/CronLogTypeOrmImpl';

@Injectable()
export class MetricasOperacionScheduler {
  private readonly logger = new Logger(MetricasOperacionScheduler.name);

  constructor(
    @Inject(GuardarMetricasOperacion)
    private readonly guardarMetricas: GuardarMetricasOperacion,
    @Inject(CRON_LOG_REPO)
    private readonly cronLogRepo: MetricasCronLogTypeOrmRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    // Calcula "ayer", sin hora
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    // Crear log inicial
    const log = await this.cronLogRepo.createLog({
      jobName: 'MetricasOperacionBatch',
      fechaResumen: ayer,
      startTime: new Date(),
      status: 'STARTED',
    });

    try {
      this.logger.log(
        `Ejecutando cálculo de métricas para el día: ${ayer.toISOString().slice(0, 10)}`,
      );
      await this.guardarMetricas.run(ayer);

      await this.cronLogRepo.updateLog(log.id, {
        endTime: new Date(),
        status: 'OK',
        message: 'Ejecución exitosa',
      });
    } catch (err) {
      this.logger.error(
        `Error ejecutando cálculo de métricas para el día ${ayer.toISOString().slice(0, 10)}:`,
        (err as Error).stack || String(err),
      );
      await this.cronLogRepo.updateLog(log.id, {
        endTime: new Date(),
        status: 'ERROR',
        error: (err as Error).stack || String(err),
      });
    }
  }
}
