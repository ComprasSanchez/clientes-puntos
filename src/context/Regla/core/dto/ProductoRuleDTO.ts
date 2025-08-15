import { TipoEfecto } from '../enums/ProductoEfecto';
import { BaseReglaDTO } from './ReglaDTO';

// --- Efectos posibles para reglas de producto ---
export type ProductoEfectoDTO =
  | { kind: TipoEfecto.FIJO; puntos: number }
  | {
      kind: TipoEfecto.PORCENTAJE;
      porcentaje: number;
      base?: 'precio' | 'costo';
    }
  | {
      kind: TipoEfecto.MULTIPLICADOR;
      factor: number;
      base?: 'precio' | 'costo';
    }
  | {
      kind: TipoEfecto.ESCALA;
      tramos: Array<{ min: number; max?: number; puntos: number }>;
    }
  | { kind: TipoEfecto.TOPE; min?: number; max?: number };

// --- DTO de la regla de producto (envuelto en { value: ... }) ---
export interface ProductoRuleDTO extends BaseReglaDTO {
  efecto: { value: ProductoEfectoDTO };
}
