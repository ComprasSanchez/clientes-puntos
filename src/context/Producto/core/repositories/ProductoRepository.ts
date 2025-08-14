// core/repository/ProductoRepository.ts
import { Producto } from '../entities/Producto';
import { ProductoId } from '../value-objects/ProductoId';
import { TipoClasificador } from '../enums/TipoClasificador.enum';

export abstract class ProductoRepository {
  abstract findById(id: ProductoId): Promise<Producto | null>;
  abstract upsertMany(productos: Producto[]): Promise<void>;
  abstract list(params?: {
    search?: string;
    clasificador?: { tipo: TipoClasificador; idClasificador: string };
    limit?: number;
    offset?: number;
  }): Promise<{ items: Producto[]; total: number }>;
  abstract findByCodExt(codExt: number): Promise<Producto | null>;
  abstract save(producto: Producto, meta?: { motivo?: string }): Promise<void>;
}
