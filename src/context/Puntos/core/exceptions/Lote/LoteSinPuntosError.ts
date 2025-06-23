export class LoteSinPuntosError extends Error {
  constructor(id: string, cantidad: number) {
    super(`No quedan ${cantidad} de puntos en el lote ${id}`);
    Object.setPrototypeOf(this, LoteSinPuntosError.prototype);
  }
}
