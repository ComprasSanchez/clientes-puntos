import { FieldRequiredError } from 'src/shared/core/exceptions/FieldRequiredError';
import { MaxLengthRequiredError } from 'src/shared/core/exceptions/MaxLengthRequiredError';
import { MinLengthRequiredError } from 'src/shared/core/exceptions/MinLengthRequiredError';

export class ReglaNombre {
  value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new FieldRequiredError('Nombre Regla');
    }

    // Validar que el nombre tenga al menos 2 caracteres
    if (this.value.length < 2) {
      throw new MinLengthRequiredError('Nombre Regla', 2, this.value.length);
    }

    if (this.value.length > 20) {
      throw new MaxLengthRequiredError('Nombre Regla', 20, this.value.length);
    }
  }
}
