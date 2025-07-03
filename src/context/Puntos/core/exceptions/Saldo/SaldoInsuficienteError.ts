import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class SaldoInsuficienteError extends AppException {
  constructor(sPendiente: number) {
    super(
      `Saldo insuficiente, faltan ${sPendiente} puntos`,
      HttpStatus.CONFLICT, // 409 puede usarse para errores de negocio como este
      'SALDO_INSUFICIENTE',
      { sPendiente },
    );
    this.name = SaldoInsuficienteError.name;
    Object.setPrototypeOf(this, SaldoInsuficienteError.prototype);
  }
}
