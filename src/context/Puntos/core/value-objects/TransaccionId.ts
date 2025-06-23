export class TransaccionId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new Error('TransaccionId no puede estar vacío.');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
