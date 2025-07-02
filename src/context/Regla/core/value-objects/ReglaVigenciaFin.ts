import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ReglaVigenciaFin {
  value: Date;

  constructor(value: Date) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new InvalidFormatError(this.value.toString());
    }
  }

  toString(): string {
    // Formato YYYY-MM-DD
    return this.value.toISOString().split('T')[0];
  }
}
