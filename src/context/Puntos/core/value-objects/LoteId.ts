export class LoteId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new Error('LoteId no puede estar vacío.');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
