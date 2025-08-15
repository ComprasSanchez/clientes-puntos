// core/reglas/ReglaProducto.ts
import { Regla } from '../entities/Regla';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../interfaces/IReglaEngine';
import { EfectoProducto } from '../value-objects/EfectoProducto';
import { ReglaDescripcion } from '../value-objects/ReglaDescripcion';
import { ReglaFlag } from '../value-objects/ReglaFlag';
import { ReglaId } from '../value-objects/ReglaId';
import { ReglaNombre } from '../value-objects/ReglaNombre';
import { ReglaPrioridad } from '../value-objects/ReglaPrioridad';
import { ReglaVigenciaFin } from '../value-objects/ReglaVigenciaFin';
import { ReglaVigenciaInicio } from '../value-objects/ReglaVigenciaInicio';
import { ReglaTipo } from '../value-objects/ReglaTipo';
import { TipoRegla } from '../enums/TipoRegla';
import { TipoEfecto } from '../enums/ProductoEfecto';
import { Condition } from '../interfaces/Condition';
import { ProductoEfectoDTO, ProductoRuleDTO } from '../dto/ProductoRuleDTO';
import { BaseProducto } from '../enums/BaseProducto';
import { numberFromMoney } from '../utils/number-helper';

export class ReglaProducto extends Regla {
  constructor(
    id: ReglaId,
    nombre: ReglaNombre,
    prioridad: ReglaPrioridad,
    activa: ReglaFlag,
    excluyente: ReglaFlag,
    vigenciaInicio: ReglaVigenciaInicio,
    vigenciaFin: ReglaVigenciaFin | undefined,
    descripcion: ReglaDescripcion | undefined,
    private readonly efecto: EfectoProducto,
    condition?: Condition<ReglaEngineRequest>,
  ) {
    super(
      id,
      nombre,
      ReglaTipo.create(TipoRegla.PRODUCTO),
      prioridad,
      activa,
      excluyente,
      vigenciaInicio,
      vigenciaFin,
      descripcion,
      condition,
    );
  }

  get efectoVO(): EfectoProducto {
    return this.efecto;
  }

  protected applyIfTrue(ctx: ReglaEngineRequest): ReglaEngineResult {
    const lineas = Array.isArray(ctx.productos) ? ctx.productos : [];
    if (lineas.length === 0) return { debitAmount: 0, reglasAplicadas: {} };

    let puntosTotal = 0;

    for (const linea of lineas) {
      const cantidad = Math.max(1, linea.cantidad ?? 1);

      const baseSel =
        this.efecto.kind === TipoEfecto.PORCENTAJE ||
        this.efecto.kind === TipoEfecto.MULTIPLICADOR
          ? (this.efecto.base ??
            (linea.usarBase as BaseProducto) ??
            BaseProducto.COSTO)
          : ((linea.usarBase as BaseProducto) ?? BaseProducto.PRECIO);

      const baseNumber =
        baseSel === BaseProducto.PRECIO
          ? numberFromMoney(linea.precio)
          : numberFromMoney(linea.costo);

      let puntos = 0;

      switch (this.efecto.kind) {
        case TipoEfecto.FIJO:
          puntos = this.efecto.puntos;
          break;
        case TipoEfecto.PORCENTAJE:
          puntos = (baseNumber * this.efecto.porcentaje) / 100;
          break;
        case TipoEfecto.MULTIPLICADOR:
          puntos = baseNumber * this.efecto.factor;
          break;
        case TipoEfecto.ESCALA: {
          const tramo = this.efecto.tramos.find(
            (t) => cantidad >= t.min && (t.max == null || cantidad <= t.max),
          );
          puntos = tramo ? tramo.puntos : 0;
          break;
        }
        case TipoEfecto.TOPE:
          puntos = 0; // se aplica post total
          break;
      }

      if (this.efecto.kind !== TipoEfecto.ESCALA) puntos *= cantidad;
      puntosTotal += Math.max(0, puntos);
    }

    if (this.efecto.kind === TipoEfecto.TOPE) {
      const { min, max } = this.efecto;
      if (min != null) puntosTotal = Math.max(puntosTotal, min);
      if (max != null) puntosTotal = Math.min(puntosTotal, max);
    }

    if (puntosTotal <= 0) return { debitAmount: 0, reglasAplicadas: {} };

    return {
      debitAmount: 0,
      credito: { cantidad: Math.round(puntosTotal) },
      reglasAplicadas: {
        [this.tipo.value]: [{ id: this.id.value, nombre: this.nombre.value }],
      },
    };
  }

  static fromJSON(json: ProductoRuleDTO): ReglaProducto {
    // Reconstruir el VO de efecto según el tipo
    const efectoValue = json.efecto.value;
    let efecto: EfectoProducto;

    switch (efectoValue.kind) {
      case TipoEfecto.FIJO:
        efecto = { kind: TipoEfecto.FIJO, puntos: efectoValue.puntos };
        break;
      case TipoEfecto.PORCENTAJE:
        efecto = {
          kind: TipoEfecto.PORCENTAJE,
          porcentaje: efectoValue.porcentaje,
          base: efectoValue.base,
        };
        break;
      case TipoEfecto.MULTIPLICADOR:
        efecto = {
          kind: TipoEfecto.MULTIPLICADOR,
          factor: efectoValue.factor,
          base: efectoValue.base,
        };
        break;
      case TipoEfecto.ESCALA:
        efecto = { kind: TipoEfecto.ESCALA, tramos: efectoValue.tramos };
        break;
      case TipoEfecto.TOPE:
        efecto = {
          kind: TipoEfecto.TOPE,
          min: efectoValue.min,
          max: efectoValue.max,
        };
        break;
      default:
        throw new Error(`Tipo de efecto no soportado`);
    }

    return new ReglaProducto(
      new ReglaId(json.id.value),
      new ReglaNombre(json._nombre.value),
      new ReglaPrioridad(json._prioridad.value),
      new ReglaFlag(json._activa.value),
      new ReglaFlag(json._excluyente.value),
      new ReglaVigenciaInicio(new Date(json._vigenciaInicio.value)),
      json._vigenciaFin
        ? new ReglaVigenciaFin(new Date(json._vigenciaFin.value))
        : undefined,
      json._descripcion
        ? new ReglaDescripcion(json._descripcion.value)
        : undefined,
      efecto,
      // Si tenés `condition` en el DTO, acá deberías reconstruirla también.
      undefined,
    );
  }

  toDTO(): ProductoRuleDTO {
    return {
      tipo: { value: this.tipo.value },
      id: { value: this.id.value },
      _nombre: { value: this.nombre.value },
      _prioridad: { value: this.prioridad.value },
      _activa: { value: this.activa.value },
      _excluyente: { value: this.excluyente.value },
      _vigenciaInicio: { value: this.vigenciaInicio.value.toISOString() },
      _vigenciaFin: this.vigenciaFin
        ? { value: this.vigenciaFin.value.toISOString() }
        : undefined,
      _descripcion: this.descripcion
        ? { value: this.descripcion.value }
        : undefined,
      efecto: this.efectoProductoToDTO(this.efecto),
    };
  }

  efectoProductoToDTO(efecto: EfectoProducto): { value: ProductoEfectoDTO } {
    switch (efecto.kind) {
      case TipoEfecto.FIJO:
        return { value: { kind: TipoEfecto.FIJO, puntos: efecto.puntos } };

      case TipoEfecto.PORCENTAJE:
        return {
          value: {
            kind: TipoEfecto.PORCENTAJE,
            porcentaje: efecto.porcentaje,
            base: efecto.base ?? BaseProducto.PRECIO,
          },
        };

      case TipoEfecto.MULTIPLICADOR:
        return {
          value: {
            kind: TipoEfecto.MULTIPLICADOR,
            factor: efecto.factor,
            base: efecto.base ?? BaseProducto.PRECIO,
          },
        };

      case TipoEfecto.ESCALA:
        return {
          value: {
            kind: TipoEfecto.ESCALA,
            tramos: efecto.tramos, // [{ min, max?, puntos }]
          },
        };

      case TipoEfecto.TOPE:
        return {
          value: {
            kind: TipoEfecto.TOPE,
            min: efecto.min,
            max: efecto.max,
          },
        };

      default: {
        throw new Error(
          `Efecto no soportado en DTO: ${JSON.stringify(efecto)}`,
        );
      }
    }
  }
}
