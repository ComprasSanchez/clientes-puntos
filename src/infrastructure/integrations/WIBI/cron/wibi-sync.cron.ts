import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WibiSyncService } from '../services/wibi-sync.service';

@Injectable()
export class WibiSyncCron {
  private readonly logger = new Logger(WibiSyncCron.name);
  private isRunning = false;

  constructor(private readonly wibiSyncService: WibiSyncService) {}

  @Cron('0 13 * * *', {
    timeZone: 'America/Argentina/Cordoba',
  })
  async handleDailySync(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('WIBI sync skipped because another execution is still running');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('Starting daily WIBI sync');

      await this.wibiSyncService.run({
        batchSize: 2000,
      });

      this.logger.log('Daily WIBI sync finished successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Daily WIBI sync failed: ${message}`, stack);
    } finally {
      this.isRunning = false;
    }
  }
}