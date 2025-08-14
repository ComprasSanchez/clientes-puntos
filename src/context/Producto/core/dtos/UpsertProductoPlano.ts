// core/dtos/UpsertProductoPlano.ts
import { TipoClasificador } from '../enums/TipoClasificador.enum';

export interface UpsertProductoPlano {
  idProducto: number;
  producto: string;
  presentacion?: string;
  costo: number;
  precio: number;
  clasificadores: Array<{
    idTipoClasificador: TipoClasificador | number;
    idClasificador: string;
    nombre: string;
  }>;
}
