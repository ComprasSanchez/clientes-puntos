import { ConversionRule } from '@regla/core/entities/ConversionRule';

export interface RuleCotizacionFinder {
  findCotizacion(): Promise<ConversionRule>;
}
