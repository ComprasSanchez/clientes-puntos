// infrastructure/transaction/TransactionalRunner.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmTransactionContext } from './TypeOrmTransactionContext';

@Injectable()
export class TransactionalRunner {
  constructor(private readonly dataSource: DataSource) {}

  async runInTransaction<T>(
    fn: (ctx: TypeOrmTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const ctx = new TypeOrmTransactionContext(manager);
      return fn(ctx);
    });
  }
}
