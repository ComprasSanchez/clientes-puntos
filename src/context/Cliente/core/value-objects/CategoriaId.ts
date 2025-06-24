import { FieldRequiredError } from 'src/shared/core/exceptions/FieldRequiredError';

export class CategoriaId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) throw new FieldRequiredError('Id Categoria');
    this._value = value;
  }

  get value(): string {
    return this._value;
  }
}
