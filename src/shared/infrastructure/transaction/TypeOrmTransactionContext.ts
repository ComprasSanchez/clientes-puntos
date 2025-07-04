// infrastructure/transaction/TypeOrmTransactionContext.ts
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { EntityManager } from 'typeorm';

export class TypeOrmTransactionContext implements TransactionContext {
  constructor(public readonly manager: EntityManager) {}
}
