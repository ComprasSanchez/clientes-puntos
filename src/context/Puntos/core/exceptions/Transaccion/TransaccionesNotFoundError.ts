import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class TransaccionesNotFoundError extends AppException {
  constructor(id: string) {
    super(
      `La operacion ${id} no posee transacciones asociadas`,
      HttpStatus.NOT_FOUND,
      'TRANSACCIONES_NOT_FOUND',
      {
        id,
      },
    );
    this.name = TransaccionesNotFoundError.name;
    Object.setPrototypeOf(this, TransaccionesNotFoundError.prototype);
  }
}
