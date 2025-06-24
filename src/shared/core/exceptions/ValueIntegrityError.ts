export class ValueIntegrityError extends Error {
  constructor(value: number) {
    super(`Valor ${value} invalido. Debe ser un entero >= 0.`);
    Object.setPrototypeOf(this, ValueIntegrityError.prototype);
  }
}
