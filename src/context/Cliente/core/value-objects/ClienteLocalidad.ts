import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteLocalidad {
  value: string | null;

  constructor(value?: string | null) {
    const v = value != null && value.trim() !== '' ? value.trim() : null;
    this.value = v;
    this.validate();
  }

  private validate() {
    if (this.value === null) {
      return;
    }
    const locRegex =
      /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*$/;
    if (!locRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
