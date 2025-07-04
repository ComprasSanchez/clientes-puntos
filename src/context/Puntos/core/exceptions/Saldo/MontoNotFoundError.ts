import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class MontoNotFoundError extends AppException {
  constructor() {
    super(
      `Se necesita el monto para esta operacion`,
      HttpStatus.NOT_FOUND,
      'MONTO_NOT_FOUND',
    );
    this.name = MontoNotFoundError.name;
    Object.setPrototypeOf(this, MontoNotFoundError.prototype);
  }
}
