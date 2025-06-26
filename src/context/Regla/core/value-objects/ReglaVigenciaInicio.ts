import { InvalidDateError } from 'src/shared/core/exceptions/InvalidDateError';
import { InvalidFormatError } from 'src/shared/core/exceptions/InvalidFormatError';

export class ReglaVigenciaInicio {
  value: Date;

  constructor(value: Date) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new InvalidFormatError(this.value.toString());
    }
    const hoy = new Date();
    if (this.value > hoy) {
      throw new InvalidDateError(this.value.toISOString().split('T')[0]);
    }
  }

  toString(): string {
    // Formato YYYY-MM-DD
    return this.value.toISOString().split('T')[0];
  }
}
