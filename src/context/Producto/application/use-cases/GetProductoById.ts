// core/use-cases/GetProductoById.ts
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTO_REPO } from '../../core/tokens/tokens';
import { ProductoRepository } from '../../core/repositories/ProductoRepository';
import { Producto } from '../../core/entities/Producto';
import { ProductoId } from '../../core/value-objects/ProductoId';

@Injectable()
export class GetProductoById {
  constructor(
    @Inject(PRODUCTO_REPO) private readonly repo: ProductoRepository,
  ) {}
  async run(id: string): Promise<Producto | null> {
    return this.repo.findById(ProductoId.from(id));
  }
}
