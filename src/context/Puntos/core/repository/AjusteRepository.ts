// ajuste/core/domain/AjusteRepository.ts
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { Ajuste } from '../entities/Ajuste';

export interface AjusteRepository {
  save(ajuste: Ajuste, ctx?: TransactionContext): Promise<void>;
}
