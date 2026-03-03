export class UUIDValidationError extends Error {
  constructor() {
    super('No se generó un UUIDv4 Valido');
    Object.setPrototypeOf(this, UUIDValidationError.prototype);
  }
}
