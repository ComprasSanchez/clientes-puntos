import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class ConsumoNoRegistradoError extends AppException {
  constructor(operacionId: number) {
    super(
      `No existe consumo registrado para operación ${operacionId}`,
      HttpStatus.NOT_FOUND,
      'CONSUMO_NO_REGISTRADO',
      { operacionId },
    );
    this.name = ConsumoNoRegistradoError.name;
    Object.setPrototypeOf(this, ConsumoNoRegistradoError.prototype);
  }
}
