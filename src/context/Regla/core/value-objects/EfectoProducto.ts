// core/reglas/producto.efectos.ts
import { TipoEfecto } from '../enums/ProductoEfecto';
import { BaseProducto } from '../enums/BaseProducto';
import { ReglaEngineRequest } from '../interfaces/IReglaEngine';
import { ProductoRuleItemDTO } from '../dto/ProductoRuleItemDTO';
import { Condition } from '../interfaces/Condition';

// =======================
// Efecto con PRIMITIVOS
// =======================
export type EfectoProducto =
  | { kind: TipoEfecto.FIJO; puntos: number } // suma fija
  | {
      kind: TipoEfecto.PORCENTAJE;
      porcentaje: number;
      base?: BaseProducto; // 'PRECIO' | 'COSTO' según tu enum
    }
  | {
      kind: TipoEfecto.MULTIPLICADOR;
      factor: number;
      base?: BaseProducto;
    }
  | {
      kind: TipoEfecto.ESCALA;
      tramos: Array<{ min: number; max?: number; puntos: number }>;
    }
  | { kind: TipoEfecto.TOPE; min?: number; max?: number };

// =======================
// Helpers de matching
// =======================

// Normaliza ctx.productos a array, seguro
function getLineas(ctx: ReglaEngineRequest): readonly ProductoRuleItemDTO[] {
  if (!ctx.productos) return [];
  return Array.isArray(ctx.productos) ? ctx.productos : [];
}

// Match por productoId (string/uuid/sku)
export const matchProductoId = (id: string): Condition<ReglaEngineRequest> => ({
  evaluate: (ctx) => getLineas(ctx).some((l) => l.productoId === id),
});

// Match por codExt (number)
export const matchCodExt = (codExt: number): Condition<ReglaEngineRequest> => ({
  evaluate: (ctx) => getLineas(ctx).some((l) => l.codExt === codExt),
});

// Match por clasificador genérico (type + id)
export const matchClasificador = (
  type: string,
  idClasificador: string | number,
): Condition<ReglaEngineRequest> => ({
  evaluate: (ctx) =>
    getLineas(ctx).some((l) =>
      (l.clasificadores ?? []).some(
        (c) => c.type === type && String(c.id) === String(idClasificador),
      ),
    ),
});

// Match por tag
export const matchTag = (tag: string): Condition<ReglaEngineRequest> => ({
  evaluate: (ctx) => getLineas(ctx).some((l) => (l.tags ?? []).includes(tag)),
});
