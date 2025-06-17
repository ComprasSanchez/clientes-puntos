export class ClienteTelefono {
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

    // Opcional “+” al inicio, seguido de entre 7 y 15 dígitos
    const telefonoRegex = /^\+?[0-9]{7,15}$/;
    if (!telefonoRegex.test(this.value)) {
      throw new Error(
        `Teléfono inválido: "${this.value}" no cumple con el formato esperado.`,
      );
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
