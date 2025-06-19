export class FechaExpiracion {
  public readonly value: Date;

  constructor(value: Date | null) {
    if (value == null) {
      throw new Error('FechaExpiracion no puede ser nula.');
    }
    this.value = new Date(value);
    this.validate();
  }

  private validate() {
    if (isNaN(this.value.getTime())) {
      throw new Error(`FechaExpiracion inválida: ${this.value.getDate()}`);
    }
  }

  toDate(): Date {
    return this.value;
  }
}
