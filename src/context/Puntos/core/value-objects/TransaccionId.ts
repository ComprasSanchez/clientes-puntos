import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';

export class TransaccionId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new FieldRequiredError('ID');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
