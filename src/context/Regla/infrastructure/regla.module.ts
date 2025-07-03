import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReglaEntity } from './entities/regla.entity';
import { ReglaPersistenceModule } from './persistence/persistence.module';
import { DatabaseModule } from 'src/infrastructure/database/database.module';

import { ReglaRepository } from '../core/repository/ReglaRepository';
import { TypeOrmReglaRepository } from './persistence/ReglaRepository/ReglaTypeOrmImpl';

import { ReglaEngineServiceInMemory } from './services/ReglaEngineServiceInMemory';
import { ReglaEngineAdapter } from './adapters/ReglaEngineAdapter';

import { RulesOrchestrationService } from '../application/services/RuleOrchestationService';

import { ExecuteRulesUseCase } from '@regla/application/use-cases/ReglaProcessRules/ProcessRules';

import {
  REGLA_REPO,
  REGLA_ENGINE,
  REGLA_ENGINE_ADAPTER,
  RULE_ORCHESTATION_SERVICE,
  EXECUTE_RULES_USE_CASE,
} from '../core/tokens/tokens';
import { ReglaFindAll } from '@regla/application/use-cases/ReglaFindAll/FindAll';
import { ReglaFindById } from '@regla/application/use-cases/ReglaFindById/FindById';
import { ReglaCreate } from '@regla/application/use-cases/ReglaCreate/Create';
import { ReglaUpdate } from '@regla/application/use-cases/ReglaUpdate/Update';
import { ReglaDelete } from '@regla/application/use-cases/ReglaDelete/Delete';
import { ReglaController } from './controllers/ReglaController';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReglaEntity]),
    DatabaseModule,
    ReglaPersistenceModule,
  ],
  controllers: [ReglaController],
  providers: [
    // Persistencia
    TypeOrmReglaRepository,
    { provide: REGLA_REPO, useExisting: TypeOrmReglaRepository },
    { provide: ReglaRepository, useExisting: REGLA_REPO },

    // Engine (puedes cambiar a otro en prod/test)
    { provide: REGLA_ENGINE, useClass: ReglaEngineServiceInMemory },

    // Adapter para el engine (opcional, swap con in-memory/real)
    ReglaEngineAdapter,
    { provide: REGLA_ENGINE_ADAPTER, useExisting: ReglaEngineAdapter },

    // Orchestration service (token propio)
    {
      provide: RULE_ORCHESTATION_SERVICE,
      useClass: RulesOrchestrationService,
    },

    // Use cases
    ReglaFindAll,
    ReglaFindById,
    ReglaCreate,
    ReglaUpdate,
    ReglaDelete,
    ExecuteRulesUseCase,
    { provide: EXECUTE_RULES_USE_CASE, useExisting: ExecuteRulesUseCase },
  ],
  exports: [
    REGLA_REPO,
    EXECUTE_RULES_USE_CASE,
    ReglaPersistenceModule,
    DatabaseModule,
  ],
})
export class ReglaInfrastructureModule {}
