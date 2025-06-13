export class ClienteCategoria {
  value: string;

  constructor(value: string) {
    this.value = value?.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new Error('La categoría del cliente no puede ser vacía.');
    }
    // Solo letras y espacios, entre 2 y 20 caracteres
    const catRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]{2,20}$/;
    if (!catRegex.test(this.value)) {
      throw new Error(
        `Categoría inválida: "${this.value}" debe tener entre 2 y 20 letras.`,
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
