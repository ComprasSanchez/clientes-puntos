import { FieldRequiredError } from 'src/shared/core/exceptions/FieldRequiredError';
import { InvalidNumberFormatError } from 'src/shared/core/exceptions/InvalidNumberFormatError';

export class ReglaPrioridad {
  constructor(public readonly value: number) {
    if (!value || value === null) {
      throw new FieldRequiredError('Prioridad');
    }
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidNumberFormatError(value);
    }
  }
}
