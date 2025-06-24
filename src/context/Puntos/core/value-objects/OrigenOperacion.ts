import { FieldRequiredError } from 'src/shared/core/exceptions/FieldRequiredError';
import { MaxLengthRequiredError } from 'src/shared/core/exceptions/MaxLengthRequiredError';

export class OrigenOperacion {
  public readonly value: string;

  constructor(value: string) {
    const v = value?.trim();
    if (!v) {
      throw new FieldRequiredError('Origen de Operacion');
    }
    this.value = v;
    this.validate();
  }

  private validate() {
    if (this.value.length > 50) {
      throw new MaxLengthRequiredError(
        'Origen de Operacion',
        50,
        this.value.length,
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
