import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class InvalidDateError extends AppException {
  constructor(date: string) {
    super(
      `Fecha inválida. ${date} no puede ser en el futuro`,
      HttpStatus.BAD_REQUEST,
      'INVALID_DATE',
      { date },
    );
    this.name = InvalidDateError.name;
    Object.setPrototypeOf(this, InvalidDateError.prototype);
  }
}
