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
import { ConversionRuleDTO } from '../dto/ConversionRuleDTO';

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

  static fromJSON(json: ConversionRuleDTO): ConversionRule {
    return new ConversionRule(
      new ReglaId(json.id.value),
      new ReglaNombre(json._nombre.value),
      new ReglaPrioridadCotizacion(json._prioridad.value),
      new ReglaFlag(json._activa.value),
      new ReglaFlag(json._excluyente.value),
      new ReglaVigenciaInicio(new Date(json._vigenciaInicio.value)),
      json._vigenciaFin
        ? new ReglaVigenciaFin(new Date(json._vigenciaFin.value))
        : undefined,
      json._descripcion
        ? new ReglaDescripcion(json._descripcion.value)
        : undefined,
      new RatioConversion(json.rateAccred.value),
      new RatioConversion(json.rateSpend.value),
      json.creditExpiryDays
        ? new DiasExpiracion(json.creditExpiryDays.value)
        : undefined,
    );
  }

  toDTO(): ConversionRuleDTO {
    return {
      tipo: { value: TipoRegla.CONVERSION },
      id: { value: this.id.value },
      _nombre: { value: this.nombre.value },
      _prioridad: { value: this.prioridad.value },
      _activa: { value: this.activa.value },
      _excluyente: { value: this.excluyente.value },
      _vigenciaInicio: { value: this.vigenciaInicio.value.toISOString() }, // o value directo según tu modelo
      _vigenciaFin: this.vigenciaFin
        ? { value: this.vigenciaFin.value.toISOString() }
        : undefined,
      _descripcion: this.descripcion
        ? { value: this.descripcion.value }
        : undefined,
      rateAccred: { value: this.rateAccredVo.value },
      rateSpend: { value: this.rateSpendVo.value },
      creditExpiryDays: this.creditExpiryDaysVo
        ? { value: this.creditExpiryDaysVo.value }
        : undefined,
    };
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
