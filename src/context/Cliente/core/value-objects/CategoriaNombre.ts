import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';

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
