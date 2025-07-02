import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class FechaExpiracion {
  public readonly value: Date;

  constructor(value: Date | null) {
    if (value == null) {
      throw new FieldRequiredError('Fecha de Expiracion');
    }
    this.value = new Date(value);
    this.validate();
  }

  private validate() {
    if (isNaN(this.value.getTime())) {
      throw new InvalidFormatError(this.value.toISOString().split('T')[0]);
    }
  }

  toDate(): Date {
    return this.value;
  }
}
