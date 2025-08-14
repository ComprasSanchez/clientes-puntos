// application/use-cases/DesactivarProducto.ts
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTO_REPO } from '../../core/tokens/tokens';
import { ProductoRepository } from '../../core/repositories/ProductoRepository';

@Injectable()
export class DesactivarProducto {
  constructor(
    @Inject(PRODUCTO_REPO) private readonly repo: ProductoRepository,
  ) {}

  async run(idOrCodExt: number): Promise<void> {
    const prod = await this.repo.findByCodExt(idOrCodExt);
    if (!prod) throw new Error('Producto no encontrado');
    prod.desactivar(); // método del agregado, valida reglas e idempotencia
    await this.repo.save(prod); // persiste y audita
  }
}
