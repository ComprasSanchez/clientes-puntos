import { Module, Provider } from '@nestjs/common';
import { ReglaEngine } from '../core/interfaces/IReglaEngine';
import { ReglaEngineServiceInMemory } from './services/ReglaEngineServiceInMemory';
import { RulesOrchestrationService } from '../application/services/RuleOrchestationService';
import { ExecuteRulesUseCase } from '../application/use-cases/ProcessRules';
import { REGLA_REPO } from './tokens/tokens';
import { ReglaRepository } from '../core/repository/ReglaRepository';

const providers: Provider[] = [
  // 1) Stub in-memory del motor de reglas
  { provide: ReglaEngine, useClass: ReglaEngineServiceInMemory },
  { provide: ReglaRepository, useClass: /**AQUI VA LA IMPL DE TYPE ORM */},

  // 2) Servicio de orquestación que implementa ReglaEngine
  {
    provide: ReglaRepository,
    useFactory: (reglaRepo: ReglaRepository) => new RulesOrchestrationService(reglaRepo),
    inject: [ReglaRepository],
  },

  // 3) Caso de uso que delega al servicio de orquestación
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
