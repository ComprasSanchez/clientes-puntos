// @regla/infrastructure/transformers/EfectoProductoTransformer.ts
import { ValueTransformer } from 'typeorm';
import { EfectoProducto } from '@regla/core/value-objects/EfectoProducto';
import { TipoEfecto } from '@regla/core/enums/ProductoEfecto';
import { BaseProducto } from '@regla/core/enums/BaseProducto';
import {
  getNumber,
  isRecord,
  parseBaseProducto,
  parseTipoEfecto,
} from '../helpers/efecto-producto-type-safe';

// JSON almacenado (guardamos los valores del enum tal cual)
type EfectoDb =
  | { kind: TipoEfecto.FIJO; puntos: number }
  | { kind: TipoEfecto.PORCENTAJE; porcentaje: number; base?: BaseProducto }
  | { kind: TipoEfecto.MULTIPLICADOR; factor: number; base?: BaseProducto }
  | {
      kind: TipoEfecto.ESCALA;
      tramos: Array<{ min: number; max?: number; puntos: number }>;
    }
  | { kind: TipoEfecto.TOPE; min?: number; max?: number };

// -------------------- transformer --------------------
export const EfectoProductoTransformer: ValueTransformer = {
  to(value?: EfectoProducto | null): EfectoDb | null {
    if (!value) return null;
    switch (value.kind) {
      case TipoEfecto.FIJO:
        return { kind: TipoEfecto.FIJO, puntos: value.puntos };
      case TipoEfecto.PORCENTAJE:
        return {
          kind: TipoEfecto.PORCENTAJE,
          porcentaje: value.porcentaje,
          base: value.base,
        };
      case TipoEfecto.MULTIPLICADOR:
        return {
          kind: TipoEfecto.MULTIPLICADOR,
          factor: value.factor,
          base: value.base,
        };
      case TipoEfecto.ESCALA:
        return { kind: TipoEfecto.ESCALA, tramos: value.tramos };
      case TipoEfecto.TOPE:
        return { kind: TipoEfecto.TOPE, min: value.min, max: value.max };
    }
  },

  // TypeORM puede darnos `unknown` desde la DB -> tipamos `raw` como unknown y parseamos seguro
  from(raw?: unknown): EfectoProducto | null {
    if (raw == null) return null;
    if (!isRecord(raw))
      throw new Error('EfectoProducto inválido: payload no es objeto');

    const kind = parseTipoEfecto(raw.kind);

    switch (kind) {
      case TipoEfecto.FIJO: {
        const puntos = getNumber(raw, 'puntos', 0);
        return { kind, puntos };
      }
      case TipoEfecto.PORCENTAJE: {
        const porcentaje = getNumber(raw, 'porcentaje', 0);
        const base = parseBaseProducto(raw.base);
        return { kind, porcentaje, base };
      }
      case TipoEfecto.MULTIPLICADOR: {
        const factor = getNumber(raw, 'factor', 0);
        const base = parseBaseProducto(raw.base);
        return { kind, factor, base };
      }
      case TipoEfecto.ESCALA: {
        const tr = raw.tramos;
        // validación suave de tramos
        const tramos: Array<{ min: number; max?: number; puntos: number }> = [];
        if (Array.isArray(tr)) {
          for (const t of tr) {
            if (isRecord(t)) {
              tramos.push({
                min: getNumber(t, 'min', 0),
                max:
                  isRecord(t) && typeof t.max !== 'undefined'
                    ? getNumber(t, 'max')
                    : undefined,
                puntos: getNumber(t, 'puntos', 0),
              });
            }
          }
        }
        return { kind, tramos };
      }
      case TipoEfecto.TOPE: {
        const min =
          typeof raw.min !== 'undefined' ? getNumber(raw, 'min') : undefined;
        const max =
          typeof raw.max !== 'undefined' ? getNumber(raw, 'max') : undefined;
        return { kind, min, max };
      }
    }
  },
};
