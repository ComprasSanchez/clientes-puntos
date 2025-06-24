export class InvalidFormatError extends Error {
  constructor(value: string) {
    super(`${value} tiene un formato inválido o caracteres no permitidos`);
    Object.setPrototypeOf(this, InvalidFormatError.prototype);
  }
}
