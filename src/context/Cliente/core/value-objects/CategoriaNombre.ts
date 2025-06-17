export class CategoriaNombre {
  value: string;

  constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new Error('El nombre de la categoria no puede ser vacío.');
    }

    // Validar que el nombre tenga al menos 2 caracteres
    if (this.value.length < 2) {
      throw new Error(
        `Nombre inválido: "${this.value}" debe tener al menos 2 caracteres.`,
      );
    }

    if (this.value.length > 20) {
      throw new Error(
        `Nombre inválido: "${this.value}" no puede tener más de 20 caracteres.`,
      );
    }

    // Sólo letras (incluyendo acentos y ñ) y espacios
    const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;
    if (!nombreRegex.test(this.value)) {
      throw new Error(
        `Nombre inválido: "${this.value}" contiene caracteres no permitidos.`,
      );
    }
  }
}
