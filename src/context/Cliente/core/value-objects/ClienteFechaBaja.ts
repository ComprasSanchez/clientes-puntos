import { InvalidDateError } from 'src/shared/core/exceptions/InvalidDateError';
import { InvalidFormatError } from 'src/shared/core/exceptions/InvalidFormatError';

export class ClienteFechaBaja {
  value: Date | null;

  constructor(value?: Date | null) {
    this.value = value ?? null;
    this.validate();
  }

  private validate() {
    // Nullable: si es null, no hay validación
    if (this.value === null) {
      return;
    }
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new InvalidFormatError(this.value.toISOString().split('T')[0]);
    }
    const ahora = new Date();
    if (this.value > ahora) {
      throw new InvalidDateError(this.value.toISOString().split('T')[0]);
    }
  }

  toString(): string {
    return this.value ? this.value.toISOString().split('T')[0] : '';
  }
}
