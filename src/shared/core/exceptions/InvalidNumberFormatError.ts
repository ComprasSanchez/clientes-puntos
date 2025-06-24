export class InvalidNumberFormatError extends Error {
  constructor(value: any) {
    super(`El valor ${value} es inválido. Debe ser un número entero válido`);
    Object.setPrototypeOf(this, InvalidNumberFormatError.prototype);
  }
}
