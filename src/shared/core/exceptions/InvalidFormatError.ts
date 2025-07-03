import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class InvalidFormatError extends AppException {
  constructor(value: string) {
    super(
      `${value} tiene un formato inválido o caracteres no permitidos`,
      HttpStatus.BAD_REQUEST,
      'INVALID_FORMAT',
      { value },
    );
    this.name = InvalidFormatError.name;
    Object.setPrototypeOf(this, InvalidFormatError.prototype);
  }
}
