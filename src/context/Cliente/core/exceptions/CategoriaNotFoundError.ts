import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class CategoriaNotFoundError extends AppException {
  constructor(id: string) {
    super(
      `Categoria con ID ${id} no encontrada`,
      HttpStatus.NOT_FOUND,
      'CATEGORIA_NOT_FOUND',
      { id },
    );
    this.name = CategoriaNotFoundError.name;
    Object.setPrototypeOf(this, CategoriaNotFoundError.prototype);
  }
}
