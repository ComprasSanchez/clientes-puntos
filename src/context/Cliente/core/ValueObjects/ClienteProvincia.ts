export class ClienteProvincia {
  value: string | null;

  constructor(value?: string | null) {
    const v = value != null && value.trim() !== '' ? value.trim() : null;
    this.value = v;
    this.validate();
  }

  private validate() {
    if (this.value === null) {
      return;
    }
    const provRegex =
      /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?: [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*$/;
    if (!provRegex.test(this.value)) {
      throw new Error(
        `Provincia inválida: "${this.value}" contiene caracteres no permitidos.`,
      );
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
