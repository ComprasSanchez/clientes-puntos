import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class OperacionNotFoundError extends AppException {
  constructor(id: string) {
    super(
      `Operación ${id} no encontrada`,
      HttpStatus.NOT_FOUND,
      'OPERACION_NOT_FOUND',
      {
        id,
      },
    );
    this.name = OperacionNotFoundError.name;
    Object.setPrototypeOf(this, OperacionNotFoundError.prototype);
  }
}
