// src/context/Puntos/infrastructure/ReglaEngineInfrastructureModule.ts
import { Module, Provider } from '@nestjs/common';
import { ReglaEngineServiceInMemory } from './services/ReglaEngineServiceInMemory';
import { ExecuteRulesUseCase } from '../application/use-cases/ProcessRules';
import { RulesOrchestrationService } from '../application/services/RuleOrchestationService';
import { ReglaEngine } from '../core/interfaces/IReglaEngine';
import { REGLA_REPO } from './tokens/tokens';
import { ReglaRepository } from '../core/repository/ReglaRepository';

const providers: Provider[] = [
  // 1) Repositorio de reglas in-memory
  { provide: ReglaEngine, useClass: ReglaEngineServiceInMemory },

  // 2) Servicio de orquestación que usa el repositorio
  {
    provide: ReglaEngine,
    useFactory: (repo: ReglaRepository) => new RulesOrchestrationService(repo),
    inject: [REGLA_REPO],
  },

  // 3) Use-case para ejecutar reglas
  {
    provide: ExecuteRulesUseCase,
    useFactory: (orch: RulesOrchestrationService) =>
      new ExecuteRulesUseCase(orch),
    inject: [RulesOrchestrationService],
  },
];

@Module({
  providers,
  exports: [ExecuteRulesUseCase],
})
export class ReglaInfrastructureModule {}
