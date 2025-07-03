import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class ClienteNotFoundError extends AppException {
  constructor(id: string) {
    super(
      `Cliente con ID ${id} no encontrado`,
      HttpStatus.NOT_FOUND,
      'CLIENTE_NOT_FOUND',
      { id },
    );
    this.name = ClienteNotFoundError.name;
    Object.setPrototypeOf(this, ClienteNotFoundError.prototype);
  }
}
