// @puntos/domain/repositories/TransaccionRepository.ts
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { Transaccion } from '../entities/Transaccion';
import { LoteId } from '../value-objects/LoteId';
import { TransaccionId } from '../value-objects/TransaccionId';

/**
 * Puerto de repositorio para la entidad Transaccion (línea del ledger de puntos).
 * Abstrae la persistencia y recuperación de transacciones.
 */
export interface TransaccionRepository {
  /**
   * Obtiene todas las transacciones registradas en el sistema.
   */
  findAll(): Promise<Transaccion[]>;

  /**
   * Busca una transacción por su identificador.
   * @param id Identificador de la transacción
   */
  findById(id: TransaccionId): Promise<Transaccion | null>;

  /**
   * Obtiene todas las transacciones asociadas a un lote específico.
   * @param loteId Identificador del lote
   */
  findByLote(loteId: LoteId): Promise<Transaccion[]>;

  /**
   * Obtiene todas las transacciones de un cliente, a partir de sus lotes.
   * @param clienteId Identificador del cliente
   */
  findByCliente(clienteId: string): Promise<Transaccion[]>;

  /**
   * Obtiene todas las transacciones de un cliente, a partir de una OperacionId.
   * @param OpId Identificador de la Operacion..
   */
  findByOperationId(opId: number): Promise<Transaccion[]>;

  /**
   * Obtiene todas las transacciones de un cliente, a partir de una OperacionId.
   * @param ref Identificador de la referencia.
   */
  findByReferencia(ref: string): Promise<Transaccion[]>;

  findBetween(startUtc: Date, endUtc: Date): Promise<Transaccion[]>;

  /**
   * Obtiene todas las transacciones de un cliente, a partir de sus lotes.
   * @param fecha Identificador del cliente
   * @deprecated Usar findBetween
   */
  findByFecha(fecha: Date): Promise<Transaccion[]>;

  /**
   * Persiste una nueva transacción en el ledger.
   * @param transaccion Transacción a guardar
   */
  save(transaccion: Transaccion, ctx?: TransactionContext): Promise<void>;

  /**
   * Elimina (o marca como eliminada) una transacción.
   * @param id Identificador de la transacción
   */
  delete(id: TransaccionId, ctx?: TransactionContext): Promise<void>;
}
