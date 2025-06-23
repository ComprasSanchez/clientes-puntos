export class TransactionTimestampFactory {
  /**
   * Devuelve el timestamp actual en milisegundos
   * (ej: 1730001234567)
   */
  static now(): number {
    return Date.now();
  }
}
