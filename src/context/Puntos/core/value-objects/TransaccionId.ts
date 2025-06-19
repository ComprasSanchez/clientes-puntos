export class TransaccionId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new Error('TransaccionId no puede estar vacío.');
    }
    this.value = value;
    this.validate();
  }

  private validate() {
    // Validación simple de UUIDv4
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(this.value)) {
      throw new Error(
        `TransaccionId inválido: "${this.value}" debe ser un UUIDv4 válido.`,
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
