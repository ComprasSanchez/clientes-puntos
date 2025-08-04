import { RulesCacheLoader } from '@infrastructure/cache/rules-cache/rules-cache.loader';
import { Inject, Injectable } from '@nestjs/common';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { ReglaNotFound } from '@regla/core/exceptions/ReglaNotFoundError';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { REGLA_REPO } from '@regla/core/tokens/tokens';

@Injectable()
export class ReglaFindCotizacion {
  constructor(
    @Inject(REGLA_REPO)
    private readonly reglaRepository: ReglaRepository,
    @Inject(RulesCacheLoader)
    private readonly rulesCacheLoader: RulesCacheLoader,
  ) {}

  async run(): Promise<ConversionRule> {
    const reglas = await this.rulesCacheLoader.getRules();
    const regla = reglas.find((r) => r.prioridad.value === 0);

    if (regla) return regla as ConversionRule;

    const reglaRepo = await this.reglaRepository.findCotizacion();
    if (!reglaRepo) {
      throw new ReglaNotFound();
    }

    await this.rulesCacheLoader.invalidate();
    return reglaRepo;
  }
}
