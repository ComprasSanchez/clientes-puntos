export class LoteNoDisponibleError extends Error {
  constructor(id: string) {
    super(`Lote ${id} no esta Disponible`);
    Object.setPrototypeOf(this, LoteNoDisponibleError.prototype);
  }
}
