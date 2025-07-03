import { Inject, Injectable } from '@nestjs/common';
import { ReglaCriteria } from '../../core/entities/Criteria';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../../core/interfaces/IReglaEngine';
import { ReglaRepository } from '../../core/repository/ReglaRepository';
import { RuleProcessor } from '../../core/services/RuleProcessor';
import { REGLA_REPO } from '@regla/core/tokens/tokens';

/**
 * Servicio de aplicación: orquesta repositorio, criterios y procesador de reglas.
 */
@Injectable()
export class RulesOrchestrationService {
  private processor = new RuleProcessor();

  constructor(
    @Inject(REGLA_REPO) private readonly reglaRepo: ReglaRepository,
  ) {}

  /**
   * Devuelve el resultado de aplicar reglas a un contexto dado.
   */
  public async execute(
    context: ReglaEngineRequest,
  ): Promise<ReglaEngineResult> {
    // 1. Construir criterios
    const criteria = ReglaCriteria.fromContext(context);

    // 2. Obtener reglas filtradas (JSONLogic en infra)
    const reglasFiltradas = await this.reglaRepo.findByCriteria(criteria);

    // 3. Procesar lista de reglas puras
    return this.processor.process(reglasFiltradas, context);
  }
}
