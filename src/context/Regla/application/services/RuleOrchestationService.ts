import { Inject, Injectable } from '@nestjs/common';
import { ReglaCriteria } from '../../core/entities/Criteria';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../../core/interfaces/IReglaEngine';
import { RuleProcessor } from '../../core/services/RuleProcessor';
import { RULE_QUERY_SERVICE } from '@regla/core/tokens/tokens';
import { RulesQueryService } from './RulesQueryService';

/**
 * Servicio de aplicación: orquesta repositorio, criterios y procesador de reglas.
 */
@Injectable()
export class RulesOrchestrationService {
  private processor = new RuleProcessor();

  constructor(
    @Inject(RULE_QUERY_SERVICE) private readonly ruleService: RulesQueryService,
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
    const reglasFiltradas = await this.ruleService.findByCriteria(criteria);

    // 3. Procesar lista de reglas puras
    return this.processor.process(reglasFiltradas, context);
  }
}
