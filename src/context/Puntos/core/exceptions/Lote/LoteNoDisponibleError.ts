import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class LoteNoDisponibleError extends AppException {
  constructor(id: string) {
    super(
      `Lote ${id} no está disponible`,
      HttpStatus.CONFLICT, // Puedes cambiar el status si prefieres otro más apropiado
      'LOTE_NO_DISPONIBLE',
      { id },
    );
    this.name = LoteNoDisponibleError.name;
    Object.setPrototypeOf(this, LoteNoDisponibleError.prototype);
  }
}
