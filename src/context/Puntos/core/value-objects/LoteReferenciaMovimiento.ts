export class ReferenciaMovimiento {
  public readonly value: string;

  constructor(value?: string | null) {
    const v = value != null && value.trim() !== '' ? value.trim() : null;
    if (v === null) {
      throw new Error('ReferenciaMovimiento no puede estar vacía.');
    }
    this.value = v;
    this.validate();
  }

  private validate() {
    if (this.value.length > 100) {
      throw new Error(
        `ReferenciaMovimiento inválida: "${this.value}" excede 100 caracteres.`,
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
