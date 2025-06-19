/**
 * Puerto que expone el contexto Cliente para obtener saldo de puntos.
 */
export interface IPuntosService {
  /**
   * Devuelve el saldo actual de puntos del cliente.
   * @param clienteId  Identificador del cliente
   * @returns Número de puntos disponibles
   */
  obtenerSaldoActual(clienteId: string): Promise<number>;
}
