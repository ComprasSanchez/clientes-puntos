// core/reglas/dto/ProductoRuleItemDTO.ts
import { BaseProducto } from '../enums/BaseProducto';
import { MoneyDTO } from './MoneyDTO';

export interface ProductoRuleItemDTO {
  productoId?: string; // SKU/uuid interno (opcional si solo tenés codExt)
  codExt?: number;
  nombre?: string;

  cantidad: number; // default 1
  precio: MoneyDTO; // money plano
  costo: MoneyDTO; // money plano

  // etiquetas/clasificaciones para match de reglas
  clasificadores?: Array<{ type: string; id: string | number }>;
  tags?: string[];

  // hint para base de cálculo en esta línea
  usarBase?: BaseProducto;
}
