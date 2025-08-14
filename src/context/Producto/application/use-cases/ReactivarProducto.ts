import { Inject, Injectable } from '@nestjs/common';
import { ProductoRepository } from '../../core/repositories/ProductoRepository';
import { PRODUCTO_REPO } from '../../core/tokens/tokens';

// application/use-cases/ReactivarProducto.ts
@Injectable()
export class ReactivarProducto {
  constructor(
    @Inject(PRODUCTO_REPO) private readonly repo: ProductoRepository,
  ) {}

  async run(idOrCodExt: number): Promise<void> {
    const prod = await this.repo.findByCodExt(idOrCodExt);
    if (!prod) throw new Error('Producto no encontrado');
    prod.reactivar(); // valida invariantes (p. ej., que no esté eliminado lógico definitivo)
    await this.repo.save(prod);
  }
}
