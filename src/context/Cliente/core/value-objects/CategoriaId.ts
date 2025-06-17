export class CategoriaId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) throw new Error('El ID de la Categoria no puede ser vacío.');
    this._value = value;
  }

  get value(): string {
    return this._value;
  }
}
