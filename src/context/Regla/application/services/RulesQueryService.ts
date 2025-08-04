// src/regla/application/services/rules-query.service.ts
import { Injectable } from '@nestjs/common';
import { RulesCacheLoader } from '@infrastructure/cache/rules-cache/rules-cache.loader';
import { Regla as ReglaDomain } from '@regla/core/entities/Regla';
import { ReglaCriteria } from '@regla/core/entities/Criteria';

@Injectable()
export class RulesQueryService {
  constructor(private readonly rulesCacheLoader: RulesCacheLoader) {}

  async findByCriteria(criteria: ReglaCriteria): Promise<ReglaDomain[]> {
    // 1. Obtené todas las reglas cacheadas
    const reglas = await this.rulesCacheLoader.getRules();

    // 2. Filtrá según los criterios recibidos (en memoria, porque ya están cacheadas)
    return reglas
      .filter((regla) => {
        if (!regla.activa) return false;
        if (criteria.fecha) {
          const fecha = criteria.fecha.value;
          if (regla.vigenciaInicio.value > fecha) return false;
          if (regla.vigenciaFin && regla.vigenciaFin.value < fecha)
            return false;
        }
        return true;
      })
      .sort((a, b) => a.prioridad.value - b.prioridad.value);
  }
}
