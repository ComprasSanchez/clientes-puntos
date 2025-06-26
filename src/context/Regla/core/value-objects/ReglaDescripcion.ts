import { MaxLengthRequiredError } from 'src/shared/core/exceptions/MaxLengthRequiredError';

export class ReglaDescripcion {
  value: string;

  constructor(value?: string) {
    if (value != null) {
      const trimmed = value.trim();
      this.value = trimmed;
      this.validate();
    }
  }

  private validate() {
    // Máximo 200 caracteres
    if (this.value.length > 200) {
      throw new MaxLengthRequiredError('Descripción', 200, this.value.length);
    }
  }
}
