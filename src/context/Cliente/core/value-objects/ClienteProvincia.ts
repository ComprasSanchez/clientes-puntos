import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteProvincia {
  value: string | null;

  constructor(value?: string | null) {
    const v =
      value != null && value.trim() !== ''
        ? ClienteProvincia.normalize(value)
        : null;
    this.value = v;
    this.validate();
  }

  private static normalize(input: string): string {
    const normalized = input.trim().replace(/\s+/g, ' ');
    const isAllUppercase = /^[A-ZÁÉÍÓÚÑÜ ]+$/.test(normalized);

    if (!isAllUppercase) {
      return normalized;
    }

    return normalized
      .split(' ')
      .map((part) =>
        part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : '',
      )
      .join(' ');
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
