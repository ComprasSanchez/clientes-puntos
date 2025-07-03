import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class LoteNotFoundError extends AppException {
  constructor(id: string) {
    super(`Lote ${id} no encontrado`, HttpStatus.NOT_FOUND, 'LOTE_NOT_FOUND', {
      id,
    });
    this.name = LoteNotFoundError.name;
    Object.setPrototypeOf(this, LoteNotFoundError.prototype);
  }
}
