export class RefundError extends Error {
  constructor() {
    super(
      'Sin una referencia de la operación a devolver es imposible gestionar la operacion.',
    );
    Object.setPrototypeOf(this, RefundError.prototype);
  }
}
