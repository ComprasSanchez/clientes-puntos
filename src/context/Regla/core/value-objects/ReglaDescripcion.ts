import { MaxLengthRequiredError } from 'src/shared/core/exceptions/MaxLengthRequiredError';

export class ReglaDescripcion {
  value: string;

  constructor(value?: string) {
    // Normalizar: trim del string; null/undefined → null
    if (value) this.validate();
  }

  private validate() {
    // Máximo 200 caracteres
    if (this.value.length > 200) {
      throw new MaxLengthRequiredError('Descripción', 200, this.value.length);
    }
  }
}
