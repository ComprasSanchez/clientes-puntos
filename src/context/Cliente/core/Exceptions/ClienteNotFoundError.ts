export class ClienteNotFoundError extends Error {
  constructor(id: string) {
    super(`Cliente con ID ${id} no encontrado`);
    Object.setPrototypeOf(this, ClienteNotFoundError.prototype);
  }
}
