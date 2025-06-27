import { Regla } from '../entities/Regla';
import { ReglaCriteria } from '../entities/Criteria';

/**
 * Repositorio de reglas (hexagonal): definición de los métodos necesarios.
 */
export interface ReglaRepository {
  /**
   * Recupera las reglas que cumplen los criterios.
   */
  findByCriteria(criteria: ReglaCriteria): Promise<Regla[]>;

  /**
   * Recupera una regla por su ID.
   */
  findById(id: string): Promise<Regla | null>;
}
