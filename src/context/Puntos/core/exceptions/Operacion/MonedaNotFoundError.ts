import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class MonedaNotFoundError extends AppException {
  constructor(id: string) {
    super(
      `Debe proporcionar un valor de Puntos o Moneda`,
      HttpStatus.NOT_FOUND,
      'MONEDA_NOT_FOUND',
      {
        id,
      },
    );
    this.name = MonedaNotFoundError.name;
    Object.setPrototypeOf(this, MonedaNotFoundError.prototype);
  }
}
