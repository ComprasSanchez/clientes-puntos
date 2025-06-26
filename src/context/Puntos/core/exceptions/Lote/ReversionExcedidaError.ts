export class ReversionExcedidaError extends Error {
  constructor(loteId: string) {
    super(`Reversión excede puntos originales del lote ${loteId}`);
    Object.setPrototypeOf(this, ReversionExcedidaError.prototype);
  }
}
