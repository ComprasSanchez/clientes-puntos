import { BaseProducto } from '@regla/core/enums/BaseProducto';
import { TipoEfecto } from '@regla/core/enums/ProductoEfecto';
import { TipoRegla } from '@regla/core/enums/TipoRegla';

// 🔹 Efecto de producto (primitivos)
export type EfectoProductoDTO =
  | { kind: TipoEfecto.FIJO; puntos: number }
  | {
      kind: TipoEfecto.PORCENTAJE;
      porcentaje: number;
      base?: BaseProducto;
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

// (opcional) separar configs por tipo de regla para mayor seguridad
export type ReglaConfigResponseDto =
  | {
      tipo: TipoRegla.CONVERSION;
      rateAccred: number;
      rateSpend: number;
      creditExpiryDays?: number;
    }
  | { tipo: TipoRegla.PRODUCTO; efecto: EfectoProductoDTO };

// -----------------------------------------------------------
// DTO final
// -----------------------------------------------------------
export class ReglaResponseDto {
  id: string;
  nombre: string;
  tipo: TipoRegla | string;
  prioridad: number;
  activa: boolean;
  excluyente: boolean;
  vigenciaInicio: Date | string;
  vigenciaFin?: Date | string;
  descripcion?: string;

  // Opción A (estricta, recomendada):
  // config?: ReglaConfigResponseDto;

  // Opción B (compatible hacia atrás, campos opcionales):
  config?: {
    // para CONVERSION
    rateAccred?: number;
    rateSpend?: number;
    creditExpiryDays?: number;

    // para PRODUCTO
    efecto?: EfectoProductoDTO;
  };
}
