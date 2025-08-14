// application/use-cases/ActualizarPrecioProducto.ts
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTO_REPO } from '../../core/tokens/tokens';
import { ProductoRepository } from '../../core/repositories/ProductoRepository';
import { Dinero } from '../../core/value-objects/Dinero';

type Input = {
  codExt: number;
  nuevoPrecio?: number; // minor units o float según tu VO
  nuevoCosto?: number;
};

@Injectable()
export class ActualizarPrecioProducto {
  constructor(
    @Inject(PRODUCTO_REPO) private readonly repo: ProductoRepository,
  ) {}

  async run(input: Input): Promise<void> {
    const prod = await this.repo.findByCodExt(input.codExt);
    if (!prod) throw new Error('Producto no encontrado');

    if (typeof input.nuevoPrecio === 'number') {
      prod.cambiarPrecio(Dinero.from(input.nuevoPrecio));
    }
    if (typeof input.nuevoCosto === 'number') {
      prod.cambiarCosto(Dinero.from(input.nuevoCosto));
    }

    // Validaciones de negocio: márgenes mínimos, locks, etc.
    // prod.validarMargenMinimo();

    await this.repo.save(prod);
  }
}
