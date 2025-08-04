// src/infrastructure/cache/rules/rules-cache.service.ts
import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../redis/redis-cache.service';

@Injectable()
export class RulesCacheService {
  private readonly RULES_KEY = 'reglas:activas';

  constructor(private readonly redis: RedisCacheService) {}

  async getRules<T>(): Promise<T[] | null> {
    return this.redis.getJSON<T[]>(this.RULES_KEY);
  }

  async setRules<T>(rules: T[]): Promise<void> {
    await this.redis.setJSON(this.RULES_KEY, rules);
  }

  async invalidate(): Promise<void> {
    await this.redis.del(this.RULES_KEY);
  }
}
