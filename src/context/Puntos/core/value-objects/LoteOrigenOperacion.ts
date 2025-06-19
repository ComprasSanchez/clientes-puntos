export class OrigenOperacion {
  public readonly value: string;

  constructor(value: string) {
    const v = value?.trim();
    if (!v) {
      throw new Error('OrigenOperacion no puede estar vacío.');
    }
    this.value = v;
    this.validate();
  }

  private validate() {
    if (this.value.length > 50) {
      throw new Error(
        `OrigenOperacion inválido: "${this.value}" excede 50 caracteres.`,
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
