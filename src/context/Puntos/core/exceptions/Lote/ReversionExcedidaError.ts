import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class ReversionExcedidaError extends AppException {
  constructor(loteId: string) {
    super(
      `Reversión excede puntos originales del lote ${loteId}`,
      HttpStatus.CONFLICT,
      'REVERSION_EXCEDIDA',
      { loteId },
    );
    this.name = ReversionExcedidaError.name;
    Object.setPrototypeOf(this, ReversionExcedidaError.prototype);
  }
}
