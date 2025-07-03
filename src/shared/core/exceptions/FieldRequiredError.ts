import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class FieldRequiredError extends AppException {
  constructor(key: string) {
    super(
      `El campo ${key} no puede estar vacío, Es requerido`,
      HttpStatus.BAD_REQUEST, // 400: Error de validación del usuario
      'FIELD_REQUIRED',
      { key },
    );
    this.name = FieldRequiredError.name;
    Object.setPrototypeOf(this, FieldRequiredError.prototype);
  }
}
