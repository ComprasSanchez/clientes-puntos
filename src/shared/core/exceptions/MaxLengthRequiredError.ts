import { HttpStatus } from '@nestjs/common';
import { AppException } from '@shared/core/exceptions/AppException';

export class MaxLengthRequiredError extends AppException {
  constructor(key: string, expected: number, received: number) {
    super(
      `Campo ${key} inválido. Debe tener un máximo de ${expected} carácteres, pero se recibieron ${received} carácteres.`,
      HttpStatus.BAD_REQUEST,
      'MAX_LENGTH_REQUIRED',
      { key, expected, received },
    );
    this.name = MaxLengthRequiredError.name;
    Object.setPrototypeOf(this, MaxLengthRequiredError.prototype);
  }
}
