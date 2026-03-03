import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteProvincia {
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
    const provRegex =
      /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*$/;
    if (!provRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
