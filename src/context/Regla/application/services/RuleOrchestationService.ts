import { ReglaCriteria } from '../../core/entities/Criteria';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../../core/interfaces/IReglaEngine';
import { ReglaRepository } from '../../core/repository/ReglaRepository';
import { RuleProcessor } from '../../core/services/RuleProcessor';

/**
 * Servicio de aplicación: orquesta repositorio, criterios y procesador de reglas.
 */
export class RulesOrchestrationService {
  private processor = new RuleProcessor();

  constructor(private readonly reglaRepo: ReglaRepository) {}

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
