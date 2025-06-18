export class PuntosOperacion {
  readonly value: number;
  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Puntos inválidos: ${value}. Deben ser enteros > 0.`);
    }
    this.value = value;
  }
}
