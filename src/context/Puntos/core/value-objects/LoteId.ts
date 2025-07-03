import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidUUIDError } from '@shared/core/exceptions/InvalidUUIDError';
import { UUID_REGEX } from '@shared/core/regex/uuid_regex';

export class LoteId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new FieldRequiredError('ID de Lote');
    }
    if (!UUID_REGEX.test(value)) throw new InvalidUUIDError(value);
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
