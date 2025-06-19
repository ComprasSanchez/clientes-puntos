export class CantidadPuntos {
  public readonly value: number;

  constructor(value: number) {
    if (value == null || isNaN(value)) {
      throw new Error('CantidadPuntos debe ser un número válido.');
    }
    this.value = Math.floor(value);
    this.validate();
  }

  private validate() {
    if (this.value < 0) {
      throw new Error(`CantidadPuntos inválida: ${this.value} debe ser >= 0.`);
    }
  }

  toNumber(): number {
    return this.value;
  }
}
