import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class TransaccionNotFoundError extends AppException {
  constructor(id: string) {
    super(
      `Transacción ${id} no encontrada`,
      HttpStatus.NOT_FOUND,
      'TRANSACCION_NOT_FOUND',
      {
        id,
      },
    );
    this.name = TransaccionNotFoundError.name;
    Object.setPrototypeOf(this, TransaccionNotFoundError.prototype);
  }
}
