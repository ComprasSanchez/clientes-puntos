import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class PrioridadReservadaError extends AppException {
  constructor() {
    super(
      'No es un valor reservado admitido. Cotizacion = 0, Otros > 0.',
      HttpStatus.BAD_REQUEST,
      'PRIORIDAD_RESERVADA',
    );
    this.name = PrioridadReservadaError.name;
    Object.setPrototypeOf(this, PrioridadReservadaError.prototype);
  }
}
