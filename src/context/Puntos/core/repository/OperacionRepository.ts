// @puntos/domain/repositories/OperacionRepository.ts
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { Operacion } from '../entities/Operacion';
import { OperacionId } from '../value-objects/OperacionId';

/**
 * Puerto de repositorio para la entidad Operacion (operación del sistema de puntos).
 * Abstrae la persistencia y recuperación de operaciones.
 */
export interface OperacionRepository {
  /**
   * Obtiene todas las operaciones registradas en el sistema.
   */
  findAll(): Promise<Operacion[]>;

  /**
   * Busca una operación por su identificador.
   * @param id Identificador de la operación
   */
  findById(id: OperacionId): Promise<Operacion | null>;

  /**
   * Obtiene todas las operaciones de un cliente.
   * @param clienteId Identificador del cliente
   */
  findByCliente(clienteId: string): Promise<Operacion[]>;

  /**
   * Obtiene operaciones a partir de una referencia.
   * @param referenciaId Identificador de la referencia
   */
  findByReferencia(referenciaId: string): Promise<Operacion[]>;

  /**
   * Persiste una nueva operación en el sistema.
   * @param operacion Operación a guardar
   */
  save(operacion: Operacion, ctx?: TransactionContext): Promise<void>;

  /**
   * Elimina (o marca como eliminada) una operación.
   * @param id Identificador de la operación
   */
  delete(id: OperacionId, ctx?: TransactionContext): Promise<void>;
}
