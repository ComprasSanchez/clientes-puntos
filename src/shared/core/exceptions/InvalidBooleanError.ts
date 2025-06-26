export class InvalidBooleanError extends Error {
  constructor(value: any) {
    super(`${value} no es un campo booleano`);
    Object.setPrototypeOf(this, InvalidBooleanError.prototype);
  }
}
