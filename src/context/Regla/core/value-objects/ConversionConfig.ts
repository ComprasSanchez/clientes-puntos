import { RatioConversion } from './RatioConversion';
import { DiasExpiracion } from './DiasExpiracion';
import { InvalidNumberFormatError } from '@shared/core/exceptions/InvalidNumberFormatError';
import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';

/**
 * Plain object interface para Serialización en JSONB.
 */
export interface ConversionConfigPlain {
  rateAccred: number;
  rateSpend: number;
  creditExpiryDays?: number;
}

/**
 * Value Object para configuración de ConversionRule.
 * creditExpiryDays es opcional (undefined = sin expiración).
 */
export class ConversionConfig {
  constructor(
    public readonly rateAccred: RatioConversion,
    public readonly rateSpend: RatioConversion,
    public readonly creditExpiryDays?: DiasExpiracion,
  ) {
    // Validaciones delegadas a los VOs internos
  }

  /**
   * Crea el VO desde un objeto plano (JSONB).
   * @throws Error si los campos obligatorios faltan o son de tipo incorrecto.
   */
  static fromPlain(raw: any): ConversionConfig {
    if (typeof raw !== 'object' || raw === null) {
      throw new FieldRequiredError('Configuracion de conversión');
    }

    const {
      rateAccred: rawRateAccred,
      rateSpend: rawRateSpend,
      creditExpiryDays: rawExpiry,
    } = raw as Record<string, unknown>;

    if (typeof rawRateAccred !== 'number' || !Number.isFinite(rawRateAccred)) {
      throw new InvalidNumberFormatError(rawRateAccred);
    }
    if (typeof rawRateSpend !== 'number' || !Number.isFinite(rawRateSpend)) {
      throw new InvalidNumberFormatError(rawRateSpend);
    }

    let expiryVO: DiasExpiracion | undefined;
    if (rawExpiry !== undefined) {
      if (typeof rawExpiry !== 'number' || !Number.isFinite(rawExpiry)) {
        throw new InvalidNumberFormatError(rawExpiry);
      }
      expiryVO = new DiasExpiracion(rawExpiry);
    }

    const rateAccredVO = new RatioConversion(rawRateAccred);
    const rateSpendVO = new RatioConversion(rawRateSpend);
    return new ConversionConfig(rateAccredVO, rateSpendVO, expiryVO);
  }

  /**
   * Convierte el VO a un objeto plano listo para JSONB.
   */
  toPlain(): ConversionConfigPlain {
    const plain: ConversionConfigPlain = {
      rateAccred: this.rateAccred.value,
      rateSpend: this.rateSpend.value,
    };
    if (this.creditExpiryDays != null) {
      plain.creditExpiryDays = this.creditExpiryDays.value;
    }
    return plain;
  }
}
