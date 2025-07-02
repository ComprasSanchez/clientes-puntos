import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';
import { MinLengthRequiredError } from '@shared/core/exceptions/MinLengthRequiredError';

export class ClienteDireccion {
  value: string | null;

  constructor(value?: string | null) {
    // Normalizar: trim y convertir en null si viene vacío o undefined
    const v = value != null && value.trim() !== '' ? value.trim() : null;
    this.value = v;
    this.validate();
  }

  private validate() {
    // Si es null, lo consideramos válido (nullable)
    if (this.value === null) {
      return;
    }

    if (this.value.length < 5) {
      throw new MinLengthRequiredError('Direccion', 5, this.value.length);
    }

    if (this.value.length > 200) {
      throw new MaxLengthRequiredError('Direccion', 200, this.value.length);
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
