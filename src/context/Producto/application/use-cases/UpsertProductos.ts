/* eslint-disable @typescript-eslint/no-unsafe-argument */
// core/use-cases/UpsertProductos.ts
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTO_REPO } from '../../core/tokens/tokens';
import { ProductoRepository } from '../../core/repositories/ProductoRepository';
import { UpsertProductoPlano } from '../../core/dtos/UpsertProductoPlano';
import { Producto } from '../../core/entities/Producto';
import { ClasificadorAsociado } from '../../core/entities/ClasificadorAsociado';
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

  // helpers seguros
  private toInt = (v: unknown): number | undefined => {
    if (typeof v === 'number')
      return Number.isFinite(v) ? Math.trunc(v) : undefined;
    if (typeof v === 'string') {
      const s = v.trim().replace(',', '.');
      if (s === '') return undefined;
      const n = Number(s);
      return Number.isFinite(n) ? Math.trunc(n) : undefined;
    }
    return undefined;
  };

  private toDecimal = (v: unknown): number | undefined => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    if (typeof v === 'string') {
      const s = v.trim().replace(',', '.');
      if (s === '') return undefined;
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  async run(input: UpsertProductoPlano[]): Promise<void> {
    // -----------------------------
    // (4) Upsert batch de maestros
    // -----------------------------
    if (input?.length) {
      const dedup = new Map<
        string,
        { tipo: number; idClasificador: number; nombre: string }
      >();

      for (const i of input) {
        for (const c of i.clasificadores ?? []) {
          const tipo = this.toInt(c.idTipoClasificador);
          const idc = this.toInt(c.idClasificador);
          if (tipo === undefined || idc === undefined) continue;

          const k = `${tipo}::${idc}`;
          const nombre = c.nombre ?? '';

          if (!dedup.has(k)) {
            dedup.set(k, { tipo, idClasificador: idc, nombre });
          } else if (!dedup.get(k)!.nombre && nombre) {
            // si ya estaba y sin nombre, y ahora viene con nombre, lo completamos
            dedup.get(k)!.nombre = nombre;
          }
        }
      }

      if (dedup.size) {
        await this.repo.upsertClasificadoresMasters([...dedup.values()]);
      }
    }

    // ---------------------------------
    // Productos (como lo tenías antes)
    // ---------------------------------
    const productos: Producto[] = await Promise.all(
      input.map(async (i) => {
        const idProducto = this.toInt(i.idProducto);
        if (idProducto === undefined) {
          throw new Error('IdProducto inválido');
        }

        const existente = await this.repo.findByCodExt(idProducto);
        const id = existente?.id ?? ProductoId.from(this.idGen.generate());

        const clasifsSanitizados: ClasificadorAsociado[] = (
          i.clasificadores ?? []
        )
          .map((c) => {
            const tipo = this.toInt(c.idTipoClasificador);
            const idc = this.toInt(c.idClasificador);
            if (tipo === undefined || idc === undefined) return undefined;
            return new ClasificadorAsociado(tipo as any, idc, c.nombre ?? '');
          })
          .filter((x): x is ClasificadorAsociado => !!x);

        const costo = this.toDecimal(i.costo) ?? 0;
        const precio = this.toDecimal(i.precio) ?? 0;

        return Producto.create({
          id,
          codExt: idProducto,
          nombre: NombreProducto.from(i.producto),
          presentacion: Presentacion.from(i.presentacion ?? ''),
          costo: Dinero.from(costo),
          precio: Dinero.from(precio),
          clasificadores: clasifsSanitizados,
          activa: i.activa,
        });
      }),
    );

    await this.repo.upsertMany(productos);
  }
}
