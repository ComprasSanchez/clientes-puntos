export class TransaccionNoPersistidaError extends Error {
  constructor() {
    super('Transaccion no persistida');
    Object.setPrototypeOf(this, TransaccionNoPersistidaError.prototype);
  }
}
