import { InvalidNumberFormatError } from '../../../../shared/core/exceptions/InvalidNumberFormatError';
import { ValueIntegrityError } from '@shared/core/exceptions/ValueIntegrityError';

export class CantidadPuntos {
  public readonly value: number;

  constructor(value: number) {
    if (value == null || isNaN(value)) {
      throw new InvalidNumberFormatError(value);
    }
    this.value = Math.floor(value);
    this.validate();
  }

  private validate() {
    if (this.value < 0) {
      throw new ValueIntegrityError(this.value);
    }
  }

  toNumber(): number {
    return this.value;
  }
}
