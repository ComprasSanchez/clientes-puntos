import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class ValueIntegrityError extends AppException {
  constructor(value: number) {
    super(
      `Valor ${value} invalido. Debe ser un entero >= 0.`,
      HttpStatus.BAD_REQUEST,
      'VALUE_INTEGRITY',
      { value },
    );
    this.name = ValueIntegrityError.name;
    Object.setPrototypeOf(this, ValueIntegrityError.prototype);
  }
}
