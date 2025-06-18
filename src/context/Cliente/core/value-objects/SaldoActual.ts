export class SaldoActual {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
    this.validate();
  }

  private validate() {
    if (this.value == null) {
      throw new Error('El saldo actual no puede ser nulo.');
    }
    if (!Number.isInteger(this.value)) {
      throw new Error(
        `Saldo inválido: "${this.value}" debe ser un número entero.`,
      );
    }
    if (this.value < 0) {
      throw new Error(`Saldo inválido: "${this.value}" no puede ser negativo.`);
    }
  }
}
