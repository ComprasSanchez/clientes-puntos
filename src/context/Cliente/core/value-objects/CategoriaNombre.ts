import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';
import { MinLengthRequiredError } from '@shared/core/exceptions/MinLengthRequiredError';

export class CategoriaNombre {
  value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new FieldRequiredError('Nombre Categoria');
    }

    // Validar que el nombre tenga al menos 2 caracteres
    if (this.value.length < 2) {
      throw new MinLengthRequiredError(
        'Nombre Categoria',
        2,
        this.value.length,
      );
    }

    if (this.value.length > 20) {
      throw new MaxLengthRequiredError(
        'Nombre Categoria',
        20,
        this.value.length,
      );
    }

    // Sólo letras (incluyendo acentos y ñ) y espacios
    const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;
    if (!nombreRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }
}
