export class ClienteNombre {
  value: string;

  constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!this.value) {
      throw new Error('El nombre del cliente no puede ser vacío.');
    }

    // Validar que el nombre tenga al menos 2 caracteres
    if (this.value.length < 2) {
      throw new Error(
        `Nombre inválido: "${this.value}" debe tener al menos 2 caracteres.`,
      );
    }

    // Validar que el nombre no contenga números ni caracteres especiales
    const nombreApellidoRegex =
      /^(?![A-ZÁÉÍÓÚÑÜ\s]+$)[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*$/;

    if (!nombreApellidoRegex.test(this.value)) {
      throw new Error(
        `Nombre inválido: "${this.value}" contiene caracteres no permitidos.`,
      );
    }
  }
}
