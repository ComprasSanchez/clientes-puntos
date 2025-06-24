import { InvalidFormatError } from 'src/shared/core/exceptions/InvalidFormatError';

export class ClienteCodigoPostal {
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

    const cpRegex = /^[0-9]{4,6}$/;
    if (!cpRegex.test(this.value)) {
      throw new InvalidFormatError(this.value);
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
