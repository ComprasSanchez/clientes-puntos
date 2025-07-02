// @puntos/core/value-objects/Moneda.ts
import { InvalidCoinError } from 'src/shared/core/exceptions/InvalidCoinError';
import { TipoMoneda } from 'src/shared/core/enums/TipoMoneda';

export class Moneda {
  private readonly _value: TipoMoneda;

  private constructor(value: TipoMoneda) {
    this._value = value;
  }

  /**
   * Crea un VO Moneda a partir de un string.
   * Valida que sea uno de los códigos en TipoMoneda (ISO 4217).
   */
  static create(value: string): Moneda {
    const upper = value.toUpperCase();
    if (!Object.values(TipoMoneda).includes(upper as TipoMoneda)) {
      throw new InvalidCoinError(value);
    }
    return new Moneda(upper as TipoMoneda);
  }

  /** Código ISO de la moneda */
  get value(): TipoMoneda {
    return this._value;
  }
}
