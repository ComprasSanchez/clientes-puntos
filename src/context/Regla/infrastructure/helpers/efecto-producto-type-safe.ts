import { BaseProducto } from '@regla/core/enums/BaseProducto';
import { TipoEfecto } from '@regla/core/enums/ProductoEfecto';
import { EfectoProducto } from '@regla/core/value-objects/EfectoProducto';

// -------------------- helpers type-safe --------------------
export function isRecord(o: unknown): o is Record<string, unknown> {
  return typeof o === 'object' && o !== null;
}
export function getNumber(
  obj: Record<string, unknown>,
  key: string,
  fallback = 0,
): number {
  const v = obj[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
export function toStringSafe(label: string, v: unknown): string {
  try {
    return `${label} inválido: ${JSON.stringify(v)}`;
  } catch {
    return `${label} inválido`;
  }
}

export function parseTipoEfecto(v: unknown): TipoEfecto {
  // 1) ya viene como enum
  if (
    v === TipoEfecto.FIJO ||
    v === TipoEfecto.PORCENTAJE ||
    v === TipoEfecto.MULTIPLICADOR ||
    v === TipoEfecto.ESCALA ||
    v === TipoEfecto.TOPE
  )
    return v as TipoEfecto;

  // 2) viene como string -> normalizamos y soportamos alias
  if (typeof v === 'string') {
    const s = v.trim().toUpperCase(); // e.g. "Fijo" -> "FIJO"
    switch (s) {
      case 'FIJO':
        return TipoEfecto.FIJO;
      case 'PORCENTAJE':
        return TipoEfecto.PORCENTAJE;
      case 'MULTIPLICADOR':
        return TipoEfecto.MULTIPLICADOR;
      case 'ESCALA':
      case 'ESCALACANTIDAD':
        return TipoEfecto.ESCALA; // alias que usaste
      case 'TOPE':
        return TipoEfecto.TOPE;
    }
  }

  throw new Error(toStringSafe('TipoEfecto', v));
}

export function parseBaseProducto(v?: unknown): BaseProducto | undefined {
  if (v == null) return undefined;

  // 1) ya viene como enum
  if (v === BaseProducto.PRECIO || v === BaseProducto.COSTO) {
    return v as BaseProducto;
  }

  // 2) viene como string -> normalizamos
  if (typeof v === 'string') {
    const s = v.trim().toUpperCase(); // "Precio" -> "PRECIO"
    if (s === 'PRECIO') return BaseProducto.PRECIO;
    if (s === 'COSTO') return BaseProducto.COSTO;
  }

  throw new Error(toStringSafe('BaseProducto', v));
}

export function toEfectoProducto(rawEfecto: unknown): EfectoProducto {
  if (!isRecord(rawEfecto)) {
    throw new Error('EfectoProducto inválido: payload no es objeto');
  }
  const kind = parseTipoEfecto(rawEfecto.kind);

  switch (kind) {
    case TipoEfecto.FIJO: {
      const puntos = getNumber(rawEfecto, 'puntos', 0);
      return { kind, puntos };
    }
    case TipoEfecto.PORCENTAJE: {
      const porcentaje = getNumber(rawEfecto, 'porcentaje', 0);
      const base = parseBaseProducto(rawEfecto.base);
      return { kind, porcentaje, base };
    }
    case TipoEfecto.MULTIPLICADOR: {
      const factor = getNumber(rawEfecto, 'factor', 0);
      const base = parseBaseProducto(rawEfecto.base);
      return { kind, factor, base };
    }
    case TipoEfecto.ESCALA: {
      const rawTramos = rawEfecto.tramos;
      const tramos: Array<{ min: number; max?: number; puntos: number }> = [];
      if (Array.isArray(rawTramos)) {
        for (const t of rawTramos) {
          if (isRecord(t)) {
            tramos.push({
              min: getNumber(t, 'min', 0),
              max: t.max != null ? getNumber(t, 'max') : undefined,
              puntos: getNumber(t, 'puntos', 0),
            });
          }
        }
      }
      return { kind, tramos };
    }
    case TipoEfecto.TOPE: {
      const min =
        rawEfecto.min != null ? getNumber(rawEfecto, 'min') : undefined;
      const max =
        rawEfecto.max != null ? getNumber(rawEfecto, 'max') : undefined;
      return { kind, min, max };
    }
  }
}
