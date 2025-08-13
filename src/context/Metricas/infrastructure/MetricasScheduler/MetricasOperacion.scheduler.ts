// src/context/Metricas/infrastructure/MetricasScheduler/MetricasOperacion.scheduler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuardarMetricasOperacion } from '../../application/puntos/use-cases/GuardarMetricasOperacion';
import { CRON_LOG_REPO } from './tokens';
import { MetricasCronLogTypeOrmRepository } from './persistence/repositories/CronLogTypeOrmImpl';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, addDays, subDays } from 'date-fns';
import { FechaDiaRange } from '../../application/puntos/value-objects/FechaDiaRange';

const TZ = 'America/Argentina/Cordoba';

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
  async handleCron(): Promise<void> {
    // 1) Ahora en TZ Córdoba
    const nowZoned = toZonedTime(new Date(), TZ);
    // 2) Rango de AYER en TZ Córdoba
    const ayerStartZoned = startOfDay(subDays(nowZoned, 1));
    const hoyStartZoned = addDays(ayerStartZoned, 1);
    // 3) Convertir límites a UTC (DB)
    const startUtc = fromZonedTime(ayerStartZoned, TZ);
    const endUtc = fromZonedTime(hoyStartZoned, TZ);

    // Preformateo para logs (evita concatenar llamados en plantilla)
    const ymdLocal = ayerStartZoned.toISOString().slice(0, 10);
    const startIso = startUtc.toISOString();
    const endIso = endUtc.toISOString();

    const log = await this.cronLogRepo.createLog({
      jobName: 'MetricasOperacionBatch',
      fechaResumen: ayerStartZoned,
      startTime: new Date(),
      status: 'STARTED',
    });

    try {
      this.logger.log(
        `Métricas para día local ${ymdLocal} | UTC ${startIso} → ${endIso}`,
      );

      await this.guardarMetricas.run(new FechaDiaRange(startUtc, endUtc));

      await this.cronLogRepo.updateLog(log.id, {
        endTime: new Date(),
        status: 'OK',
        message: 'Ejecución exitosa',
      });
    } catch (error: unknown) {
      // Narrowing seguro para ESLint/TS
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Error ejecutando cálculo de métricas: ${msg}`, stack);

      await this.cronLogRepo.updateLog(log.id, {
        endTime: new Date(),
        status: 'ERROR',
        error: stack ?? msg,
      });
    }
  }
}
