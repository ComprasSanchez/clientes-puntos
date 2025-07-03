import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class InvalidCoinError extends AppException {
  constructor(value: string) {
    super(`Moneda inválida: ${value}`, HttpStatus.BAD_REQUEST, 'INVALID_COIN', {
      value,
    });
    this.name = InvalidCoinError.name;
    Object.setPrototypeOf(this, InvalidCoinError.prototype);
  }
}
