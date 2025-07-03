import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class ReglaNotFound extends AppException {
  constructor() {
    super('Regla no encontrada', HttpStatus.NOT_FOUND, 'REGLA_NOT_FOUND');
    this.name = ReglaNotFound.name;
    Object.setPrototypeOf(this, ReglaNotFound.prototype);
  }
}
