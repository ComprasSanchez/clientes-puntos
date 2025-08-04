// src/infrastructure/cache/rules/rules-cache.loader.ts
import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  Inject,
} from '@nestjs/common';
import { RulesCacheService } from './rules-cache.service';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { REGLA_REPO } from '@regla/core/tokens/tokens';

@Injectable()
export class RulesCacheLoader implements OnApplicationBootstrap {
  private readonly logger = new Logger(RulesCacheLoader.name);

  constructor(
    @Inject(RulesCacheService)
    private readonly rulesCache: RulesCacheService,
    @Inject(REGLA_REPO)
    private readonly reglaRepo: ReglaRepository,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.loadAndCacheRules();
      this.logger.log('Reglas cacheadas en Redis al iniciar la aplicación');
    } catch (e) {
      this.logger.error('Error cacheando reglas al iniciar la app', e as Error);
    }
  }

  async loadAndCacheRules(): Promise<any[]> {
    const reglas = await this.reglaRepo.findAll();
    await this.rulesCache.setRules(reglas);
    return reglas;
  }

  async getRules(): Promise<any[]> {
    let reglas = await this.rulesCache.getRules<any>();
    if (!reglas) {
      reglas = await this.loadAndCacheRules();
    }
    return reglas;
  }

  async invalidate(): Promise<void> {
    await this.rulesCache.invalidate();
  }
}
