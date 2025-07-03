import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class MinLengthRequiredError extends AppException {
  constructor(key: string, expected: number, received: number) {
    super(
      `Campo ${key} inválido. Debe tener un mínimo de ${expected} carácteres, pero se recibieron ${received} carácteres.`,
      HttpStatus.BAD_REQUEST,
      'MIN_LENGTH_REQUIRED',
      { key, expected, received },
    );
    this.name = MinLengthRequiredError.name;
    Object.setPrototypeOf(this, MinLengthRequiredError.prototype);
  }
}
