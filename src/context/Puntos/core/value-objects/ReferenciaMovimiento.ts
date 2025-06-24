import { MaxLengthRequiredError } from 'src/shared/core/exceptions/MaxLengthRequiredError';

export class ReferenciaMovimiento {
  public readonly value: string | null;

  constructor(value?: string | null) {
    const v = value != null && value.trim() !== '' ? value.trim() : null;

    this.value = v;
    if (v) this.validate(v);
  }

  private validate(v: string) {
    if (v.length > 100) {
      throw new MaxLengthRequiredError(
        'Referencia de Movimiento',
        100,
        v.length,
      );
    }
  }

  toString(): string {
    return this.value ?? '';
  }
}
