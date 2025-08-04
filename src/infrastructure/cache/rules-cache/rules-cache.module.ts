// src/infrastructure/cache/rules/rules-cache.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { RulesCacheService } from './rules-cache.service';
import { RulesCacheLoader } from './rules-cache.loader';
import { RedisCacheModule } from '../redis/redis-cache.module';
import { ReglaInfrastructureModule } from '@regla/infrastructure/regla.module';

@Module({
  imports: [RedisCacheModule, forwardRef(() => ReglaInfrastructureModule)],
  providers: [RulesCacheService, RulesCacheLoader],
  exports: [RulesCacheService, RulesCacheLoader],
})
export class RulesCacheModule {}
