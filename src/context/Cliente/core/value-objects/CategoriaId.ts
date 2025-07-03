import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidUUIDError } from '@shared/core/exceptions/InvalidUUIDError';
import { UUID_REGEX } from '@shared/core/regex/uuid_regex';

export class CategoriaId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) throw new FieldRequiredError('Id Categoria');
    if (!UUID_REGEX.test(value)) throw new InvalidUUIDError(value);
    this._value = value;
  }

  get value(): string {
    return this._value;
  }
}
