import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { EntityManager } from 'typeorm';

export abstract class TypeOrmBaseRepository {
  protected extractManager(
    ctx?: TransactionContext,
  ): EntityManager | undefined {
    // Type guard para contexto TypeORM
    if (ctx && this.hasManager(ctx)) {
      return (ctx as { manager: EntityManager }).manager;
    }
    // Si ctx es undefined o no tiene manager, retorna undefined (usa repo normal)
    return undefined;
  }

  private hasManager(ctx: unknown): ctx is { manager: EntityManager } {
    return typeof ctx === 'object' && ctx !== null && 'manager' in ctx;
  }
}
