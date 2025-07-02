import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidNumberFormatError } from '@shared/core/exceptions/InvalidNumberFormatError';

export class ReglaPrioridad {
  constructor(public readonly value: number) {
    if (value === null || value === undefined) {
      throw new FieldRequiredError('Prioridad');
    }
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidNumberFormatError(value);
    }
    this.value = value;
  }
}
