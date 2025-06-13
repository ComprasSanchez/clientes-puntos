export class ClienteId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) throw new Error('El ID del cliente no puede ser vacío.');
    this._value = value;
  }

  get value(): string {
    return this._value;
  }
}
