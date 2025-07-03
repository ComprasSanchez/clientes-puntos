import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class SaldoNotFoundError extends AppException {
  constructor(id: string) {
    super(
      `Saldo ${id} no encontrado`,
      HttpStatus.NOT_FOUND,
      'SALDO_NOT_FOUND',
      {
        id,
      },
    );
    this.name = SaldoNotFoundError.name;
    Object.setPrototypeOf(this, SaldoNotFoundError.prototype);
  }
}
