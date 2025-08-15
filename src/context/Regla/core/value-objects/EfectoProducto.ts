import { TipoClasificador } from 'src/context/Producto/core/enums/TipoClasificador.enum';
import { ReglaEngineRequest } from '../interfaces/IReglaEngine';
import { TipoEfecto } from '../enums/ProductoEfecto';

// core/reglas/producto.efectos.ts
export type EfectoProducto =
  | { kind: TipoEfecto.FIJO; puntos: number } // suma fija
  | {
      kind: TipoEfecto.PORCENTAJE;
      porcentaje: number;
      base?: 'precio' | 'costo';
    } // 3 => 3%
  | {
      kind: TipoEfecto.MULTIPLICADOR;
      factor: number;
      base?: 'precio' | 'costo';
    } // puntos = base * factor
  | {
      kind: TipoEfecto.ESCALA;
      tramos: Array<{ min: number; max?: number; puntos: number }>;
    }
  | { kind: TipoEfecto.TOPE; min?: number; max?: number }; // post-procesado

// helpers de criterio (opcionales)
export const matchProductoId = (id: string) => ({
  evaluate: (ctx: ReglaEngineRequest) => ctx.producto?.id.value === id,
});

export const matchClasificador = (
  tipo: TipoClasificador,
  idClasificador: number,
) => ({
  evaluate: (ctx: ReglaEngineRequest) =>
    !!ctx.producto?.clasificadores.some(
      (c) => c.tipo === tipo && c.idClasificador === idClasificador,
    ),
});
