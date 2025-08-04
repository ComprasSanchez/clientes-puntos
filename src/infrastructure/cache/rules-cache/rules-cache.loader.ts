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
import { Regla } from '@regla/core/entities/Regla';

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
      const reglas: Regla[] = await this.loadAndCacheRules();
      this.logger.log(
        `Cache inicializado: ${reglas.length} reglas cargadas en Redis`,
      );
    } catch (e) {
      this.logger.error('Error cacheando reglas al iniciar la app', e as Error);
    }
  }

  async loadAndCacheRules(): Promise<Regla[]> {
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
