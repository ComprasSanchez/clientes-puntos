// core/value-objects/Dinero.ts
export class Dinero {
  private constructor(public readonly value: number) {}

  static from(value: number): Dinero {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error('Monto inválido');
    return new Dinero(n);
  }

  equals(other: Dinero): boolean {
    return this.value === other.value;
  }
}
