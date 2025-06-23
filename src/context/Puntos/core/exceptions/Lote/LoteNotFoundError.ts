export class LoteNotFoundError extends Error {
  constructor(id: string) {
    super(`Lote ${id} no encontrado`);
    Object.setPrototypeOf(this, LoteNotFoundError.prototype);
  }
}
