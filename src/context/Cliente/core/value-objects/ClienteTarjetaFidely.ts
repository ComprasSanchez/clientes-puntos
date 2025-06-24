import { InvalidFormatError } from 'src/shared/core/exceptions/InvalidFormatError';

export class ClienteTarjetaFidely {
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
    const tarjetaRegex = /^[0-9]{1,16}$/;
    if (!tarjetaRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
