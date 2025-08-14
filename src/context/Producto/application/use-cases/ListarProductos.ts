// core/use-cases/ListarProductos.ts
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTO_REPO } from '../../core/tokens/tokens';
import { ProductoRepository } from '../../core/repositories/ProductoRepository';
import { TipoClasificador } from '../../core/enums/TipoClasificador.enum';

@Injectable()
export class ListarProductos {
  constructor(
    @Inject(PRODUCTO_REPO) private readonly repo: ProductoRepository,
  ) {}
  async run(params?: {
    search?: string;
    clasificador?: { tipo: TipoClasificador; idClasificador: string };
    limit?: number;
    offset?: number;
  }) {
    return this.repo.list(params);
  }
}
