import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteTarjetaFidely {
  value: string;

  constructor(value: string) {
    this.value = value;
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
