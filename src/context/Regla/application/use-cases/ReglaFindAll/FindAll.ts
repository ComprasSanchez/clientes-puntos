// @regla/application/use-cases/ReglaFindAll.ts
import { Injectable, Inject } from '@nestjs/common';
import { Regla } from '@regla/core/entities/Regla';
import { RulesCacheLoader } from '@infrastructure/cache/rules-cache/rules-cache.loader';

@Injectable()
export class ReglaFindAll {
  constructor(
    @Inject(RulesCacheLoader)
    private readonly rulesCacheLoader: RulesCacheLoader,
  ) {}

  async run(): Promise<Regla[]> {
    return await this.rulesCacheLoader.getRules();
  }
}
