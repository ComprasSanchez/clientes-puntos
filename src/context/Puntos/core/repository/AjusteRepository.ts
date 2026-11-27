// ajuste/core/domain/AjusteRepository.ts
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { Ajuste } from '../entities/Ajuste';

export interface AjusteRepository {
  save(ajuste: Ajuste, ctx?: TransactionContext): Promise<void>;
  /** Ajuste ya registrado con esa clave externa (null si no hay). */
  findByClaveExterna(
    claveExterna: string,
    ctx?: TransactionContext,
  ): Promise<Ajuste | null>;
}
