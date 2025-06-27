import { InvalidNumberFormatError } from 'src/shared/core/exceptions/InvalidNumberFormatError';

export class MontoMoneda {
  private readonly _value: number;

  constructor(value: number) {
    // Validar que sea un número finito y no negativo
    if (!Number.isFinite(value) || value < 0) {
      throw new InvalidNumberFormatError(value);
    }
    this._value = value;
  }

  /** El valor del monto en moneda (p. ej. 123.45) */
  get value(): number {
    return this._value;
  }
}
