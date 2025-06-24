export class FieldRequiredError extends Error {
  constructor(key: string) {
    super(`El campo ${key} no puede estar vacío, Es requerido`);
    Object.setPrototypeOf(this, FieldRequiredError.prototype);
  }
}
