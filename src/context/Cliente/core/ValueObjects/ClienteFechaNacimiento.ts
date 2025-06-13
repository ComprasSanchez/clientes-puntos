export class ClienteFechaNacimiento {
  value: Date;

  constructor(value: Date) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new Error('La fecha de nacimiento no es una fecha válida.');
    }
    const hoy = new Date();
    if (this.value > hoy) {
      throw new Error('La fecha de nacimiento no puede ser futura.');
    }
  }

  toString(): string {
    // Formato YYYY-MM-DD
    return this.value.toISOString().split('T')[0];
  }
}
