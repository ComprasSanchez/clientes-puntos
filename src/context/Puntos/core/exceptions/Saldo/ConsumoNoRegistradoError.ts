export class ConsumoNoRegistradoError extends Error {
  constructor(operacionId: number) {
    super(`No existe consumo registrado para operación ${operacionId}`);
    Object.setPrototypeOf(this, ConsumoNoRegistradoError.prototype);
  }
}
