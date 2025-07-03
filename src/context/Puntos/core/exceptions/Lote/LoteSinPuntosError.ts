import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class LoteSinPuntosError extends AppException {
  constructor(id: string, cantidad: number) {
    super(
      `No quedan ${cantidad} de puntos en el lote ${id}`,
      HttpStatus.CONFLICT, // 409: Conflicto de estado/recurso
      'LOTE_SIN_PUNTOS',
      { id, cantidad },
    );
    this.name = LoteSinPuntosError.name;
    Object.setPrototypeOf(this, LoteSinPuntosError.prototype);
  }
}
