import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';

export class ClienteId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) throw new FieldRequiredError('ID');
    this._value = value;
  }

  get value(): string {
    return this._value;
  }
}
