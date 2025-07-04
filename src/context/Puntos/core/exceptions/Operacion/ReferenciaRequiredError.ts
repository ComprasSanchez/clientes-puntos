import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class ReferenciaoNotFoundError extends AppException {
  constructor() {
    super(
      `Se necesita la referencia al movimiento para esta operacion`,
      HttpStatus.NOT_FOUND,
      'REFERENCIA_NOT_FOUND',
    );
    this.name = ReferenciaoNotFoundError.name;
    Object.setPrototypeOf(this, ReferenciaoNotFoundError.prototype);
  }
}
