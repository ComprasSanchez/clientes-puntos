import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';
import { MinLengthRequiredError } from '@shared/core/exceptions/MinLengthRequiredError';

export class ClienteApellido {
  value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new FieldRequiredError('Apellido');
    }

    // Validar que el nombre tenga al menos 2 caracteres
    if (this.value.length < 2) {
      throw new MinLengthRequiredError('Apellido', 2, this.value.length);
    }

    // Validar que el nombre no supere los 50 caracteres
    if (this.value.length > 50) {
      throw new MaxLengthRequiredError('Apellido', 50, this.value.length);
    }

    // Validar que el nombre no contenga números ni caracteres especiales
    const nombreApellidoRegex =
      /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?: (?:[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+|[a-záéíóúñü]+))*$/;

    if (!nombreApellidoRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }
}
