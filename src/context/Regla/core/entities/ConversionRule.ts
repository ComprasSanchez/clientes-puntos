// @regla/domain/entities/ConversionRule.ts
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
import { ReglaTipo } from '../value-objects/ReglaTipo';
import { TipoRegla } from '../enums/TipoRegla';

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
    private rateAccred: RatioConversion,
    private rateSpend: RatioConversion,
    private creditExpiryDays?: DiasExpiracion,
  ) {
    super(
      id,
      nombre,
      ReglaTipo.create(TipoRegla.CONVERSION),
      prioridad,
      activa,
      excluyente,
      vigenciaInicio,
      vigenciaFin,
      descripcion,
      undefined,
    );
  }

  get rateAccredVo(): RatioConversion {
    return this.rateAccred;
  }

  get rateSpendVo(): RatioConversion {
    return this.rateSpend;
  }

  get creditExpiryDaysVo(): DiasExpiracion | undefined {
    return this.creditExpiryDays;
  }

  cambiarRateAccred(nuevoRate: RatioConversion): void {
    this.rateAccred = nuevoRate;
    this.touch();
  }
  cambiarRateSpend(nuevoRate: RatioConversion): void {
    this.rateSpend = nuevoRate;
    this.touch();
  }
  cambiarCreditExpiryDays(nuevoDias?: DiasExpiracion): void {
    this.creditExpiryDays = nuevoDias;
    this.touch();
  }

  protected applyIfTrue(ctx: ReglaEngineRequest): ReglaEngineResult {
    const result: ReglaEngineResult = { debitAmount: 0, reglasAplicadas: {} };

    // 1. Débito: puntos solicitados (si vienen, o 0)
    const ptsReq = ctx.puntosSolicitados?.value ?? 0;
    if (ptsReq > 0) {
      result.debitAmount = ptsReq;
    }

    // 2. Crédito: monto monetario a puntos (si viene, o 0)
    const monto = ctx.monto?.value ?? 0;
    if (monto > 0) {
      const pts = Math.floor(monto * this.rateAccred.value);
      result.credito = {
        cantidad: pts,
        expiraEn:
          this.creditExpiryDays?.value && this.creditExpiryDays?.value > 0
            ? new Date(Date.now() + this.creditExpiryDays.value * 86400000)
            : undefined,
      };
    }

    return result;
  }
}
