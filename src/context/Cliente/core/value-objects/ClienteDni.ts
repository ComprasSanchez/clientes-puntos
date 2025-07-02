import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';

export class ClienteDni {
  value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new FieldRequiredError('DNI');
    }

    // Validar formato de DNI español (7 a 10 digitos)
    const dniRegex = /^\d{7,10}$/;
    if (!dniRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }
}
