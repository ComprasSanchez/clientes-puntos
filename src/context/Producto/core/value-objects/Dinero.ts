export class Dinero {
  private constructor(public readonly value: number) {}
  static from(value: number): Dinero {
    if (Number.isNaN(value)) throw new Error('Monto inválido');
    return new Dinero(Number(value));
  }
}
