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
      throw new Error(
        `Dirección inválida: "${this.value}" debe tener al menos 5 caracteres.`,
      );
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
