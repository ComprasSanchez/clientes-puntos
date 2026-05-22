import { TransactionContext } from '../../../../shared/core/interfaces/TransactionContext';
import { HistorialSaldo } from '../entities/SaldoHistorial';
import { SaldoClienteDto } from '../interfaces/SaldoResponseDTO';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { PaginationParams } from '@shared/core/contracts/pagination';

/**
 * Puerto de repositorio para la entidad Saldo.
 * Permite abstraer la persistencia y búsquedas del saldo de un cliente.
 */
export interface SaldoRepository {
  findAll(): Promise<SaldoClienteDto[]>;
  /**
   * Obtiene el saldo actual de un cliente.
   * @param clienteId  Identificador del cliente
   * @returns El saldo o null si no existe aún
   */
  findByClienteId(clienteId: string): Promise<CantidadPuntos | null>;

  /**
   * Actualiza el saldo de un cliente, con motivo y referencia para historial.
   * Si el saldo no existe, lo crea.
   * @param clienteId            Identificador del cliente
   * @param nuevoSaldo           Nuevo valor del saldo
   * @param motivo               Motivo del cambio ('compra', 'canje', etc.)
   * @param referenciaOperacion  ID de la operación asociada
   * @param ctx                  Contexto de transacción opcional
   */
  updateSaldo(
    clienteId: string,
    nuevoSaldo: number,
    ctx?: TransactionContext,
    motivo?: string,
    referenciaOperacion?: number,
  ): Promise<void>;

  /**
   * Elimina o desactiva el saldo de un cliente.
   * @param clienteId  Identificador del cliente
   * @param ctx        Contexto de transacción opcional
   */
  delete(clienteId: string, ctx?: TransactionContext): Promise<void>;

  /**
   * Guarda un registro en el historial de cambios de saldo.
   * @param historial  Registro de historial de dominio
   * @param ctx        Contexto de transacción opcional
   */
  saveHistorial(
    historial: HistorialSaldo,
    ctx?: TransactionContext,
  ): Promise<void>;

  /**
   * Consulta el historial de cambios de saldo de un cliente.
   * @param clienteId  Identificador del cliente
   * @returns Lista de cambios de saldo
   */
  findHistorialByClienteId(clienteId: string): Promise<HistorialSaldo[]>;

  /**
   * Consulta el historial de cambios de saldo de un cliente con paginación.
   * @param clienteId  Identificador del cliente
   * @param params     Parámetros de paginación
   */
  findHistorialByClienteIdPaginated(
    clienteId: string,
    params: PaginationParams,
  ): Promise<{ items: HistorialSaldo[]; total: number }>;
}
