import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { DiasExpiracion } from '@regla/core/value-objects/DiasExpiracion';
import { RatioConversion } from '@regla/core/value-objects/RatioConversion';
import { ReglaDescripcion } from '@regla/core/value-objects/ReglaDescripcion';
import { ReglaFlag } from '@regla/core/value-objects/ReglaFlag';
import { ReglaId } from '@regla/core/value-objects/ReglaId';
import { ReglaNombre } from '@regla/core/value-objects/ReglaNombre';
import { ReglaPrioridadCotizacion } from '@regla/core/value-objects/ReglaPrioridadCotizacion';
import { ReglaVigenciaFin } from '@regla/core/value-objects/ReglaVigenciaFin';
import { ReglaVigenciaInicio } from '@regla/core/value-objects/ReglaVigenciaInicio';

/**
 * Factory for ConversionRule (Regla de conversión).
 */
export function buildConversionRule(
  overrides?: Partial<{
    id: string;
    nombre: string;
    rateAccred: number;
    rateSpend: number;
    creditExpiryDays: number;
    vigenciaInicio: Date;
    vigenciaFin: Date | null;
    activa: boolean;
    excluyente: boolean;
    descripcion?: string;
  }>,
): ConversionRule {
  const {
    id = '00000000-0000-0000-0000-000000000001',
    nombre = 'Regla de Prueba',
    rateAccred = 10,
    rateSpend = 100,
    creditExpiryDays = 0,
    vigenciaInicio = new Date('2024-01-01'),
    vigenciaFin = null,
    activa = true,
    excluyente = false,
    descripcion = 'converssion de prueba',
  } = overrides || {};

  return new ConversionRule(
    new ReglaId(id),
    new ReglaNombre(nombre),
    new ReglaPrioridadCotizacion(1),
    new ReglaFlag(activa),
    new ReglaFlag(excluyente),
    new ReglaVigenciaInicio(vigenciaInicio),
    vigenciaFin ? new ReglaVigenciaFin(vigenciaFin) : undefined,
    descripcion ? new ReglaDescripcion(descripcion) : undefined,
    new RatioConversion(rateAccred),
    new RatioConversion(rateSpend),
    new DiasExpiracion(creditExpiryDays),
  );
}
