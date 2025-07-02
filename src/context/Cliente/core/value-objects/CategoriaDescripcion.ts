import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';

export class CategoriaDescripcion {
  value: string | null;

  constructor(value?: string | null) {
    // Normalizar: trim del string; null/undefined → null
    if (value === undefined || value === null) {
      this.value = null;
    } else {
      this.value = value.trim();
    }
    this.validate();
  }

  private validate() {
    // Nullable: si es null, no validamos más
    if (this.value === null) {
      return;
    }
    // Máximo 200 caracteres
    if (this.value.length > 200) {
      throw new MaxLengthRequiredError('Descripción', 200, this.value.length);
    }
  }
}
