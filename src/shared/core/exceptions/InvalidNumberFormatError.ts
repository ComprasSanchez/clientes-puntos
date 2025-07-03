import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class InvalidNumberFormatError extends AppException {
  constructor(value: unknown) {
    super(
      `El valor es inválido. Debe ser un número entero válido`,
      HttpStatus.BAD_REQUEST,
      'INVALID_NUMBER_FORMAT',
      { value },
    );
    this.name = InvalidNumberFormatError.name;
    Object.setPrototypeOf(this, InvalidNumberFormatError.prototype);
  }
}
