import { FieldRequiredError } from 'src/shared/core/exceptions/FieldRequiredError';

export class LoteId {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new FieldRequiredError('ID de Lote');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
