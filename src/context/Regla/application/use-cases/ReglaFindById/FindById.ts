// @regla/application/use-cases/ReglaFindById.ts
import { Injectable, Inject } from '@nestjs/common';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { Regla } from '@regla/core/entities/Regla';
import { RulesCacheLoader } from '@infrastructure/cache/rules-cache/rules-cache.loader';
import { ReglaNotFound } from '@regla/core/exceptions/ReglaNotFoundError';

@Injectable()
export class ReglaFindById {
  constructor(
    @Inject(ReglaRepository) private readonly repo: ReglaRepository,
    @Inject(RulesCacheLoader)
    private readonly rulesCacheLoader: RulesCacheLoader,
  ) {}

  async run(id: string): Promise<Regla> {
    // 1️⃣ Buscá en el cache
    const reglas = await this.rulesCacheLoader.getRules();
    const regla = reglas.find((r) => r.id.value === id);

    if (regla) return regla;

    // 2️⃣ Si no está, traé de la DB y (opcional) podés recargar cache
    const fromRepo = await this.repo.findById(id);
    if (!fromRepo) throw new ReglaNotFound();
    // Podés invalidar o actualizar el cache acá si querés coherencia estricta
    await this.rulesCacheLoader.invalidate();

    return fromRepo;
  }
}
