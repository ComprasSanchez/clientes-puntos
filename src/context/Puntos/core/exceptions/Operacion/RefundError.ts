import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class RefundError extends AppException {
  constructor() {
    super(
      'Sin una referencia de la operación a devolver es imposible gestionar la operación.',
      HttpStatus.BAD_REQUEST,
      'REFUND_ERROR',
    );
    this.name = RefundError.name;
    Object.setPrototypeOf(this, RefundError.prototype);
  }
}
