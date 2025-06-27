// src/context/Regla/domain/entities/ConversionRule.ts

import { Regla } from './Regla';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../interfaces/IReglaEngine';
import { ReglaId } from '../value-objects/ReglaId';
import { ReglaNombre } from '../value-objects/ReglaNombre';
import { ReglaPrioridadCotizacion } from '../value-objects/ReglaPrioridadCotizacion';
import { ReglaFlag } from '../value-objects/ReglaFlag';
import { ReglaVigenciaInicio } from '../value-objects/ReglaVigenciaInicio';
import { ReglaVigenciaFin } from '../value-objects/ReglaVigenciaFin';
import { RatioConversion } from '../value-objects/RatioConversion';
import { DiasExpiracion } from '../value-objects/DiasExpiracion';
import { ReglaDescripcion } from '../value-objects/ReglaDescripcion';

/**
 * Regla de Cotización:
 * - Convierte monto monetario a puntos (crédito).
 * - Convierte puntos solicitados a débito de puntos.
 *
 * Lógica:
 *  - Si `puntosSolicitados` está presente, registra un débito igual a esa cantidad.
 *  - Si `monto` está presente, calcula crédito: floor(monto * rateAccred).
 */
export class ConversionRule extends Regla {
  constructor(
    id: ReglaId,
    nombre: ReglaNombre,
    prioridad: ReglaPrioridadCotizacion,
    activa: ReglaFlag,
    excluyente: ReglaFlag,
    vigenciaInicio: ReglaVigenciaInicio,
    vigenciaFin: ReglaVigenciaFin | undefined,
    descripcion: ReglaDescripcion | undefined,
    private readonly rateAccred: RatioConversion,
    private readonly rateSpend: RatioConversion,
    private readonly creditExpiryDays: DiasExpiracion,
  ) {
    super(
      id,
      nombre,
      prioridad,
      activa,
      excluyente,
      vigenciaInicio,
      vigenciaFin,
      descripcion,
    );
  }

  /**
   * Aplica la conversión según el request:
   * - `puntosSolicitados` → débito de puntos.
   * - `monto`           → crédito de puntos.
   */
  public apply(ctx: ReglaEngineRequest): ReglaEngineResult {
    const result: ReglaEngineResult = { debitos: [] };

    // Débito: uso de puntos solicitados
    if (ctx.puntosSolicitados != null && ctx.puntosSolicitados > 0) {
      result.debitos.push({
        cantidad: ctx.puntosSolicitados * this.rateSpend.value,
      });
    }

    // Crédito: conversión de monto monetario a puntos
    if (ctx.monto != null && ctx.monto > 0) {
      const pts = Math.floor(ctx.monto * this.rateAccred.value);
      result.credito = {
        cantidad: pts,
        expiraEn:
          this.creditExpiryDays.value > 0
            ? new Date(
                Date.now() + this.creditExpiryDays.value * 24 * 60 * 60 * 1000,
              )
            : undefined,
      };
    }

    return result;
  }
}
