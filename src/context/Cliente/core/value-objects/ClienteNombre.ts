import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MinLengthRequiredError } from '@shared/core/exceptions/MinLengthRequiredError';

export class ClienteNombre {
  value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new FieldRequiredError('Nombre');
    }

    // Validar que el nombre tenga al menos 2 caracteres
    if (this.value.length < 2) {
      throw new MinLengthRequiredError('Nombre', 2, this.value.length);
    }

    // Validar que el nombre no contenga números ni caracteres especiales
    const nombreApellidoRegex =
      /^(?![A-ZÁÉÍÓÚÑÜ\s]+$)[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*$/;

    if (!nombreApellidoRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }
}
