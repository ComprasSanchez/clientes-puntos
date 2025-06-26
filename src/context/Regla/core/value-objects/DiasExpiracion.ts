import { InvalidNumberFormatError } from 'src/shared/core/exceptions/InvalidNumberFormatError';

export class DiasExpiracion {
  value: number;
  constructor(value: number) {
    if (!value || value < 0) {
      throw new InvalidNumberFormatError(value);
    }
  }
}
