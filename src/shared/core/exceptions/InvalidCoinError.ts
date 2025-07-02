// @puntos/core/exceptions/MonedaInvalidaError.ts
export class InvalidCoinError extends Error {
  constructor(value: string) {
    super(`Moneda inválida: ${value}`);
    Object.setPrototypeOf(this, InvalidCoinError.prototype);
  }
}
