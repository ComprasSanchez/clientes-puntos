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
      throw new Error(
        `Descripción inválida: no puede superar 200 caracteres (recibidos ${this.value.length}).`,
      );
    }
  }
}
