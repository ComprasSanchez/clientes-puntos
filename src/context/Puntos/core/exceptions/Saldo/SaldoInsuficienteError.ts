export class SaldoInsuficienteError extends Error {
  constructor(sPendiente: number) {
    super(`Saldo insuficiente, faltan ${sPendiente} puntos`);
    Object.setPrototypeOf(this, SaldoInsuficienteError.prototype);
  }
}
