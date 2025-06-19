export class LoteId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new Error('LoteId no puede estar vacío.');
    }
    this.value = value;
    this.validate();
  }

  private validate() {
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(this.value)) {
      throw new Error(
        `LoteId inválido: "${this.value}" no cumple con el formato UUIDv4.`,
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
