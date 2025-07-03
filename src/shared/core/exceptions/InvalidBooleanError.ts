import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class InvalidBooleanError extends AppException {
  constructor(value: unknown) {
    super(
      `Este valor no es un campo booleano`,
      HttpStatus.BAD_REQUEST,
      'INVALID_BOOLEAN',
      { value },
    );
    this.name = InvalidBooleanError.name;
    Object.setPrototypeOf(this, InvalidBooleanError.prototype);
  }
}
