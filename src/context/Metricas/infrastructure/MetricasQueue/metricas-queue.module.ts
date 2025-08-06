import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MetricasQueueService } from './MetricasQueueService';
import { MetricasModule } from '../metricas.module';
import { MetricasQueueWorker } from './MetricasQueueWorker';
import { METRICAS_QEUE_SERVICE } from './tokens';

type RedisConnectionOptions = {
  host: string;
  port: number;
  username?: string;
  password?: string;
};

function buildRedisConnection(config: ConfigService): RedisConnectionOptions {
  // Si hay URL, parseamos; si no, usamos campos separados
  const redisUrl = config.get<string>('REDIS_URL');
  if (redisUrl) {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username || undefined,
      password: url.password || undefined,
    };
  }
  return {
    host: config.get<string>('REDISHOST', 'localhost'),
    port: Number(config.get<number>('REDISPORT', 6379)),
    username: config.get<string>('REDISUSER') || undefined,
    password: config.get<string>('REDIS_PASSWORD') || undefined,
  };
}

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: buildRedisConnection(config),
      }),
    }),
    BullModule.registerQueue({
      name: 'metricas-cliente',
    }),
    MetricasModule,
  ],
  providers: [
    {
      provide: METRICAS_QEUE_SERVICE,
      useClass: MetricasQueueService,
    },
    MetricasQueueWorker,
  ],
  exports: [METRICAS_QEUE_SERVICE],
})
export class MetricasQueueModule {}
