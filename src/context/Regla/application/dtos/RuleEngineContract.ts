import { ExecuteRulesRequestDto } from './RunRuleRequest.dto';
import { ExecuteRulesResponseDto } from './RunRuleResponse.dto';

export interface RuleEngineContract {
  /**
   * Procesa las reglas del motor de reglas con el contexto proporcionado.
   * @param request - Contexto que contiene los datos necesarios para procesar las reglas.
   * @returns Resultado del procesamiento de las reglas.
   */
  procesar(request: ExecuteRulesRequestDto): Promise<ExecuteRulesResponseDto>;
}
