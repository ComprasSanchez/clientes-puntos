import { Module } from '@nestjs/common';
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
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReglaEntity } from './entities/regla.entity';
import { ReglaPersistenceModule } from './persistence/persistence.module';
import { DatabaseModule } from 'src/infrastructure/database/database.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReglaEntity])],
  providers: [
    // Registry: add the repository class itself
    TypeOrmReglaRepository,

    // Bind tokens to the class instance
    { provide: REGLA_REPO, useExisting: TypeOrmReglaRepository },
    { provide: ReglaRepository, useExisting: REGLA_REPO },

    // Stub engine
    { provide: REGLA_ENGINE, useClass: ReglaEngineServiceInMemory },

    // Orchestration service
    RulesOrchestrationService,

    // Use case
    ExecuteRulesUseCase,
    { provide: EXECUTE_RULES_USE_CASE, useExisting: ExecuteRulesUseCase },

    // Adapter for engine interface
    ReglaEngineAdapter,
    { provide: REGLA_ENGINE_ADAPTER, useExisting: ReglaEngineAdapter },
    { provide: REGLA_ENGINE, useExisting: REGLA_ENGINE_ADAPTER },
  ],
  exports: [
    REGLA_REPO,
    ReglaRepository,
    EXECUTE_RULES_USE_CASE,
    REGLA_ENGINE,
    REGLA_ENGINE_ADAPTER,
    ReglaPersistenceModule,
    DatabaseModule,
  ],
})
export class ReglaInfrastructureModule {}
