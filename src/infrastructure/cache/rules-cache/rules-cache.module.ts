// src/infrastructure/cache/rules/rules-cache.module.ts
import { Module } from '@nestjs/common';
import { RulesCacheService } from './rules-cache.service';
import { RulesCacheLoader } from './rules-cache.loader';
import { RedisCacheModule } from '../redis/redis-cache.module';
import { TypeOrmReglaRepository } from '@regla/infrastructure/persistence/ReglaRepository/ReglaTypeOrmImpl';
import { REGLA_REPO } from '@regla/core/tokens/tokens';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';

@Module({
  imports: [RedisCacheModule],
  providers: [
    RulesCacheService,
    RulesCacheLoader,
    // Proveé la implementación TypeORM:
    TypeOrmReglaRepository,
    { provide: REGLA_REPO, useExisting: TypeOrmReglaRepository },
    { provide: ReglaRepository, useExisting: REGLA_REPO },
  ],
  exports: [RulesCacheService, RulesCacheLoader],
})
export class RulesCacheModule {}
