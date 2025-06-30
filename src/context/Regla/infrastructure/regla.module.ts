import { Module, Provider } from '@nestjs/common';
import { ReglaEngineServiceInMemory } from './services/ReglaEngineServiceInMemory';
import { RulesOrchestrationService } from '../application/services/RuleOrchestationService';
import { ExecuteRulesUseCase } from '../application/use-cases/ProcessRules';
import {
  EXECUTE_RULES_USE_CASE,
  REGLA_ENGINE,
  REGLA_ENGINE_ADAPTER,
  REGLA_REPO,
} from './tokens/tokens';
import { ReglaRepository } from '../core/repository/ReglaRepository';
import { ReglaEngineAdapter } from './adapters/ReglaEngineAdapter';
import { TypeOrmReglaRepository } from './persistence/ReglaRepository/ReglaTypeOrmImpl';

const providers: Provider[] = [
  // 1) Stub in-memory del motor de reglas
  { provide: REGLA_ENGINE, useClass: ReglaEngineServiceInMemory },
  { provide: REGLA_REPO, useClass: TypeOrmReglaRepository },

  // 2) Servicio de orquestación que implementa ReglaEngine
  {
    provide: REGLA_REPO,
    useFactory: (reglaRepo: ReglaRepository) =>
      new RulesOrchestrationService(reglaRepo),
    inject: [REGLA_REPO],
  },

  // 3) Caso de uso que delega al servicio de orquestación
  {
    provide: EXECUTE_RULES_USE_CASE,
    useFactory: (orch: RulesOrchestrationService) =>
      new ExecuteRulesUseCase(orch),
    inject: [RulesOrchestrationService],
  },

  { provide: REGLA_ENGINE_ADAPTER, useClass: ReglaEngineAdapter },
];

@Module({
  providers,
  exports: [EXECUTE_RULES_USE_CASE, REGLA_ENGINE_ADAPTER],
})
export class ReglaInfrastructureModule {}
