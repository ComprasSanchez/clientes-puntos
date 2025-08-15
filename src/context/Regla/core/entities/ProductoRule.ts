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

  protected applyIfTrue(ctx: ReglaEngineRequest): ReglaEngineResult {
    // Validaciones mínimas del contexto
    if (!ctx.producto) return { debitAmount: 0, reglasAplicadas: {} };

    const cantidad = Math.max(1, ctx.cantidad ?? 1);
    const baseSel =
      this.efecto.kind === TipoEfecto.PORCENTAJE ||
      this.efecto.kind === TipoEfecto.MULTIPLICADOR
        ? (this.efecto.base ?? ctx.usarBase ?? 'precio')
        : (ctx.usarBase ?? 'precio');

    const baseVO =
      baseSel === 'precio' ? ctx.producto.precio : ctx.producto.costo;
    const baseNumber =
      typeof baseVO === 'object' &&
      baseVO !== null &&
      'amount' in baseVO &&
      typeof (baseVO as { amount: unknown }).amount === 'number'
        ? (baseVO as { amount: number }).amount
        : Number(baseVO);

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
        // sin cálculo previo, tope solo recorta: lo dejamos en 0 aquí; el tope lo aplicamos como post-proceso si corresponde
        puntos = 0;
        break;
    }

    // Por unidad * cantidad (si tu política lo requiere)
    // Si querés que 'EscalaCantidad' ya incluya el total por tramo, omití este multiplicador:
    if (this.efecto.kind !== TipoEfecto.ESCALA) {
      puntos = puntos * cantidad;
    }

    // Post-proceso de tope (si esta misma regla define tope)
    if (this.efecto.kind === TipoEfecto.TOPE) {
      const { min, max } = this.efecto;
      if (min != null) puntos = Math.max(puntos, min);
      if (max != null) puntos = Math.min(puntos, max);
    }

    if (puntos <= 0) return { debitAmount: 0, reglasAplicadas: {} };

    // NOTA: en tu engine, REGISTRA por tipo. Acá devolvemos la huella de esta regla.
    return {
      debitAmount: 0, // es acreditación, no débito
      credito: { cantidad: Math.round(puntos) }, // redondeo simple; si tenés política global, hacelo en un servicio
      reglasAplicadas: {
        [this.tipo.value]: [{ id: this.id.value, nombre: this.nombre.value }],
      },
    };
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
            base: efecto.base ?? 'precio',
          },
        };

      case TipoEfecto.MULTIPLICADOR:
        return {
          value: {
            kind: TipoEfecto.MULTIPLICADOR,
            factor: efecto.factor,
            base: efecto.base ?? 'precio',
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
