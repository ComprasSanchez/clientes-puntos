import { InvalidDateError } from '@shared/core/exceptions/InvalidDateError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteFechaNacimiento {
  value: Date;

  constructor(value: Date | string) {
    // 1) Si te llega un string, lo parseas
    const date = typeof value === 'string' ? new Date(value) : value;

    this.value = date;
    this.validate();
  }

  private validate() {
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new InvalidFormatError(this.value.toString());
    }
    const hoy = new Date();
    if (this.value > hoy) {
      throw new InvalidDateError(this.value.toString());
    }
  }

  toString(): string {
    // Formato YYYY-MM-DD
    return this.value.toISOString().split('T')[0];
  }
}
