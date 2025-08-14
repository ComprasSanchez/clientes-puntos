// core/use-cases/UpsertProductos.ts
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTO_REPO } from '../../core/tokens/tokens';
import { ProductoRepository } from '../../core/repositories/ProductoRepository';
import { UpsertProductoPlano } from '../../core/dtos/UpsertProductoPlano';
import { Producto } from '../../core/entities/Producto';
import { ClasificadorAsociado } from '../../core/entities/ClasificadorAsociado';
import { TipoClasificador } from '../../core/enums/TipoClasificador.enum';
import { ProductoId } from '../../core/value-objects/ProductoId';
import { NombreProducto } from '../../core/value-objects/NombreProducto';
import { Presentacion } from '../../core/value-objects/Presentacion';
import { Dinero } from '../../core/value-objects/Dinero';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';

@Injectable()
export class UpsertProductos {
  constructor(
    @Inject(PRODUCTO_REPO) private readonly repo: ProductoRepository,
    @Inject(UUIDGenerator) private readonly idGen: UUIDGenerator,
  ) {}

  async run(input: UpsertProductoPlano[]): Promise<void> {
    // Si tu repo soporta bulk-lookup por codExt, preferilo.
    const productos: Producto[] = await Promise.all(
      input.map(async (i) => {
        const existente = await this.repo.findByCodExt(i.idProducto);
        const id = existente?.id ?? ProductoId.from(this.idGen.generate());

        return Producto.create({
          id,
          codExt: i.idProducto,
          nombre: NombreProducto.from(i.producto),
          presentacion: Presentacion.from(i.presentacion ?? ''),
          costo: Dinero.from(i.costo),
          precio: Dinero.from(i.precio),
          clasificadores: (i.clasificadores ?? []).map(
            (c) =>
              new ClasificadorAsociado(
                Number(c.idTipoClasificador) as TipoClasificador,
                Number(c.idClasificador),
                c.nombre ?? '',
              ),
          ),
          activa: i.activa,
        });
      }),
    );

    await this.repo.upsertMany(productos);
  }
}
