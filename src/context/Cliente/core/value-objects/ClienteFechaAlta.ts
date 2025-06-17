export class ClienteFechaAlta {
  value: Date;

  constructor(value: Date) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new Error('Fecha de alta inválida: no es una fecha válida.');
    }
    const ahora = new Date();
    if (this.value > ahora) {
      throw new Error(
        `Fecha de alta inválida: "${this.value.toISOString().split('T')[0]}" no puede ser en el futuro.`,
      );
    }
  }

  toString(): string {
    // YYYY-MM-DD
    return this.value.toISOString().split('T')[0];
  }
}
