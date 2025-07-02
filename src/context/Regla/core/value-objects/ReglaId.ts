import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';

export class ReglaId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new FieldRequiredError('ID de Regla');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
