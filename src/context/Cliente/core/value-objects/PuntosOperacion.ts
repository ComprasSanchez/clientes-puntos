import { ValueIntegrityError } from '@shared/core/exceptions/ValueIntegrityError';

export class PuntosOperacion {
  readonly value: number;
  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ValueIntegrityError(value);
    }
    this.value = value;
  }
}
