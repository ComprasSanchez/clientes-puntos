// @puntos/core/value-objects/Moneda.ts
import { InvalidCoinError } from '@shared/core/exceptions/InvalidCoinError';
import { TipoRegla } from '../enums/TipoRegla';

export class ReglaTipo {
  private readonly _value: TipoRegla;

  private constructor(value: TipoRegla) {
    this._value = value;
  }

  /**
   * Crea un VO Moneda a partir de un string.
   * Valida que sea uno de los códigos en TipoMoneda (ISO 4217).
   */
  static create(value: string): ReglaTipo {
    const upper = value.toUpperCase();
    if (!Object.values(TipoRegla).includes(upper as TipoRegla)) {
      throw new InvalidCoinError(value);
    }
    return new ReglaTipo(upper as TipoRegla);
  }

  /** Código ISO de la moneda */
  get value(): TipoRegla {
    return this._value;
  }
}
