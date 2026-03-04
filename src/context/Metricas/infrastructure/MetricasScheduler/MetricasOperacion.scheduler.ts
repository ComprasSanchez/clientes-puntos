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
const JOB_NAME = 'MetricasOperacionBatch';
const METRICAS_CRON_EXPRESSION =
  process.env.METRICAS_CRON_EXPRESSION || CronExpression.EVERY_10_MINUTES;

@Injectable()
export class MetricasOperacionScheduler {
  private readonly logger = new Logger(MetricasOperacionScheduler.name);
  private isRunning = false;

  constructor(
    @Inject(GuardarMetricasOperacion)
    private readonly guardarMetricas: GuardarMetricasOperacion,
    @Inject(CRON_LOG_REPO)
    private readonly cronLogRepo: MetricasCronLogTypeOrmRepository,
  ) {}

  @Cron(METRICAS_CRON_EXPRESSION)
  async handleCron(): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isEnabledInProduction = process.env.METRICAS_CRON_ENABLED === 'true';

    if (!(isProduction && isEnabledInProduction)) {
      return;
    }

    if (this.isRunning) {
      this.logger.warn(
        'Cron de métricas ya en ejecución, se omite corrida solapada',
      );
      return;
    }

    this.isRunning = true;

    const nowZoned = toZonedTime(new Date(), TZ);
    const todayStartZoned = startOfDay(nowZoned);

    const latestSuccess =
      await this.cronLogRepo.findLatestSuccessByJob(JOB_NAME);
    const fromDayZoned = latestSuccess?.fechaResumen
      ? startOfDay(toZonedTime(latestSuccess.fechaResumen, TZ))
      : subDays(todayStartZoned, 1);

    const safeFromDayZoned =
      fromDayZoned.getTime() > todayStartZoned.getTime()
        ? todayStartZoned
        : fromDayZoned;

    const log = await this.cronLogRepo.createLog({
      jobName: JOB_NAME,
      fechaResumen: safeFromDayZoned,
      startTime: new Date(),
      status: 'STARTED',
    });

    try {
      let dayCursor = safeFromDayZoned;
      let processedDays = 0;
      let lastProcessed = safeFromDayZoned;

      while (dayCursor.getTime() <= todayStartZoned.getTime()) {
        const nextDay = addDays(dayCursor, 1);
        const startUtc = fromZonedTime(dayCursor, TZ);
        const endUtc = fromZonedTime(nextDay, TZ);

        this.logger.log(
          `Métricas día local ${dayCursor.toISOString().slice(0, 10)} | UTC ${startUtc.toISOString()} -> ${endUtc.toISOString()}`,
        );

        await this.guardarMetricas.run(new FechaDiaRange(startUtc, endUtc));

        lastProcessed = dayCursor;
        processedDays += 1;
        dayCursor = nextDay;
      }

      await this.cronLogRepo.updateLog(log.id, {
        fechaResumen: lastProcessed,
        endTime: new Date(),
        status: 'OK',
        message: `Ejecución exitosa. Días recalculados: ${processedDays}`,
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
    } finally {
      this.isRunning = false;
    }
  }
}
