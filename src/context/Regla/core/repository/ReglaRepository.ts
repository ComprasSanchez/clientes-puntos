// @regla/core/repository/ReglaRepository.ts
import { Regla } from '../entities/Regla';
import { ReglaCriteria } from '../entities/Criteria';

export abstract class ReglaRepository {
  abstract findByCriteria(criteria: ReglaCriteria): Promise<Regla[]>;
  abstract findById(id: string): Promise<Regla | null>;
  abstract save(regla: Regla): Promise<void>;
  abstract update(regla: Regla): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findAll(): Promise<Regla[]>;
}
