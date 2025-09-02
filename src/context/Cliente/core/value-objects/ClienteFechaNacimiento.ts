import { InvalidDateError } from '@shared/core/exceptions/InvalidDateError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteFechaNacimiento {
  readonly value: Date | null;

  constructor(value: Date | string | null) {
    // Si es string lo parseo
    const date =
      typeof value === 'string'
        ? value
          ? new Date(value)
          : null
        : (value ?? null);

    this.value = date;
    this.validate();
  }

  private validate() {
    if (this.value === null) {
      return; // null es válido
    }

    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new InvalidFormatError(String(this.value));
    }

    const hoy = new Date();
    if (this.value > hoy) {
      throw new InvalidDateError(this.value.toISOString());
    }
  }

  toString(): string | null {
    if (this.value === null) return null;
    return this.value.toISOString().split('T')[0];
  }
}
