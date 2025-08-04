/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/infrastructure/cache/redis/redis-cache.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient, RedisOptions } from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClient; // El signo ! dice “lo inicializo en onModuleInit”
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    // 1. Usar URL completa si existe (preferible para Railway)
    const redisUrl = this.configService.get<string>('redisUrl') + '?family=0';
    if (redisUrl) {
      const opts: RedisOptions = this.getRedisOptions(redisUrl);
      this.client = new Redis(redisUrl, opts);
    } else {
      // 2. Fallback: host/port/password separados
      const host = this.configService.get<string>('redisHost', 'localhost');
      const port = this.configService.get<number>('redisPort', 6379);
      const password = this.configService.get<string>('redisPass');
      const tls = { tls: {} };
      this.client = new Redis({
        host,
        port,
        password,
        ...(tls && { tls }),
      } as RedisOptions);
    }
    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`, err.stack);
    });
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, data);
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (typeof data !== 'string') return null;
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      this.logger.warn(
        `No se pudo parsear el valor de Redis para key ${key}: ${e}`,
      );
      return null;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Helpers privados para opciones de Redis
  private getRedisOptions(url: string): RedisOptions {
    if (url.startsWith('rediss://')) {
      return { tls: {} };
    }
    return {};
  }
}
