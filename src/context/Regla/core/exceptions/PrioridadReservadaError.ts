export class PrioridadReservadaError extends Error {
  constructor() {
    super('No es un valor reservado admitido. Cotizacion = 0, Otros > 0.');
    Object.setPrototypeOf(this, PrioridadReservadaError.prototype);
  }
}
