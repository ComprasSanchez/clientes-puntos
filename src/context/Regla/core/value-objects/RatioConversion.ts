import { InvalidNumberFormatError } from 'src/shared/core/exceptions/InvalidNumberFormatError';

export class RatioConversion {
  value: number;
  constructor(value: number) {
    if (!value || value < 1) {
      throw new InvalidNumberFormatError(value);
    }
  }
}
