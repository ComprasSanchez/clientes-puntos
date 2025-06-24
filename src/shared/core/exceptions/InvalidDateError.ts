export class InvalidDateError extends Error {
  constructor(date: string) {
    super(`Fecha inválida. ${date} no puede ser en el futuro`);
    Object.setPrototypeOf(this, InvalidDateError.prototype);
  }
}
