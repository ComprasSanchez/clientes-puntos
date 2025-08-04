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
import { BaseReglaDTO, ReglaDTO } from '@regla/core/dto/ReglaDTO';
import { ReglaFactory } from '@regla/core/factories/ReglaFactory';

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
      const reglas: BaseReglaDTO[] = await this.loadAndCacheRules();
      this.logger.log(
        `Cache inicializado: ${reglas.length} reglas cargadas en Redis`,
      );
    } catch (e) {
      this.logger.error('Error cacheando reglas al iniciar la app', e as Error);
    }
  }

  async loadAndCacheRules(): Promise<ReglaDTO[]> {
    const reglas = await this.reglaRepo.findAll();
    const reglasDTO = reglas.map((regla) => regla.toDTO());
    await this.rulesCache.setRules(reglasDTO);
    return reglasDTO;
  }

  async getRules(): Promise<Regla[]> {
    let reglasDTO = await this.rulesCache.getRules<ReglaDTO>();
    if (!reglasDTO) {
      reglasDTO = await this.loadAndCacheRules();
    }
    return reglasDTO.map((dto) => ReglaFactory.fromJSON(dto));
  }

  async invalidate(): Promise<void> {
    await this.rulesCache.invalidate();
  }
}
