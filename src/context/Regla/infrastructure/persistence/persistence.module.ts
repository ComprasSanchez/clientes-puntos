// @regla/infrastructure/regla-persistence.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm'; // Import getRepositoryToken
import { Repository } from 'typeorm';
import { ReglaEntity } from '../entities/regla.entity';
import { TypeOrmReglaRepository } from './ReglaRepository/ReglaTypeOrmImpl';
import { REGLA_REPO } from '@regla/core/tokens/tokens';
import { ConversionRuleEntity } from '../entities/rule-conversion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReglaEntity, ConversionRuleEntity])],
  providers: [
    {
      provide: REGLA_REPO,
      useFactory: (
        reglaRepo: Repository<ReglaEntity>,
        conversionRuleRepo: Repository<ConversionRuleEntity>,
      ) => {
        // The factory function receives the resolved Repository instances
        return new TypeOrmReglaRepository(reglaRepo, conversionRuleRepo);
      },
      inject: [
        // Use getRepositoryToken() to tell NestJS to inject the TypeORM Repository instance
        getRepositoryToken(ReglaEntity), // Correct token for Repository<ReglaEntity>
        getRepositoryToken(ConversionRuleEntity), // Correct token for Repository<ConversionRuleEntity>
      ],
    },
  ],
  exports: [REGLA_REPO],
})
export class ReglaPersistenceModule {}
