import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class InvalidUUIDError extends AppException {
  constructor(value: string) {
    super(
      `El valor "${value}" no es un UUID válido.`,
      HttpStatus.BAD_REQUEST,
      'INVALID_UUID',
      { value },
    );
    this.name = InvalidUUIDError.name;
    Object.setPrototypeOf(this, InvalidUUIDError.prototype);
  }
}
