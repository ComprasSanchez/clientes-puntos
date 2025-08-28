// infrastructure/.../ProductoTypeOrmRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import {
  ProductoEntity,
  toDomain as productoToDomain,
  fromDomain as productoFromDomain,
} from '../entities/Producto.entity';
import {
  ProductoClasificadorEntity,
  fromDomain as clasifFromDomain,
} from '../entities/ProductoClasificador.entity';
import { ClasificadorEntity } from '../entities/Clasificador.entity'; // 👈 maestro
import { ProductoRepository } from '../../core/repositories/ProductoRepository';
import { Producto } from '../../core/entities/Producto';
import { ProductoId } from '../../core/value-objects/ProductoId';
import { TipoClasificador } from '../../core/enums/TipoClasificador.enum';

@Injectable()
export class ProductoTypeOrmRepository implements ProductoRepository {
  constructor(
    @InjectRepository(ProductoEntity)
    private readonly repo: Repository<ProductoEntity>,
    @InjectRepository(ProductoClasificadorEntity)
    private readonly repoClas: Repository<ProductoClasificadorEntity>,
    @InjectRepository(ClasificadorEntity)
    private readonly repoClasMaster: Repository<ClasificadorEntity>, // 👈 nuevo
  ) {}

  // --- NUEVO ---
  async upsertClasificadoresMasters(
    items: Array<{
      tipo: TipoClasificador | number;
      idClasificador: number;
      nombre: string;
    }>,
  ): Promise<void> {
    if (!items?.length) return;

    // dedup por (tipo,idClasificador)
    const seen = new Set<string>();
    const payload: Array<{ tipo: number; idExterno: number; nombre: string }> =
      [];
    for (const it of items) {
      const tipo = Number(it.tipo);
      const idExterno = Number(it.idClasificador);
      const k = `${tipo}::${idExterno}`;
      if (seen.has(k)) continue;
      seen.add(k);
      payload.push({ tipo, idExterno, nombre: it.nombre ?? '' });
    }
    await this.repoClasMaster.upsert(payload, ['tipo', 'idExterno']);
  }

  // --- HELPERS PRIVADOS ---
  private async syncClasificadores(p: Producto): Promise<void> {
    // 0) Upsert maestros (tipo,idExterno) con nombre
    if (p.clasificadores?.length) {
      const masters = p.clasificadores.map((c) => ({
        tipo: Number(c.tipo),
        idClasificador: c.idClasificador,
        nombre: c.nombre ?? '',
      }));
      await this.upsertClasificadoresMasters(masters);
    }

    // 1) Join actual del producto
    const current = await this.repoClas.find({
      where: { productoId: p.id.value },
    });

    // 2) Target join
    const desired = p.clasificadores.map((c) =>
      clasifFromDomain(p.id.value, c),
    );

    const key = (pid: string, tipo: number, idc: number) =>
      `${pid}::${tipo}::${idc}`;
    const desiredKeys = new Set(
      desired.map((e) => key(e.productoId!, e.tipo!, e.idClasificador!)),
    );

    // 3) DELETE los que ya no están (si querés mirror exacto)
    const toDelete = current.filter(
      (c) => !desiredKeys.has(key(c.productoId, c.tipo, c.idClasificador)),
    );
    if (toDelete.length) await this.repoClas.remove(toDelete);

    // 4) UPSERT del join (evita duplicados)
    if (desired.length) {
      await this.repoClas.upsert(desired, [
        'productoId',
        'tipo',
        'idClasificador',
      ]);
    }
  }

  // --- CONTRATO ---

  async findById(id: ProductoId): Promise<Producto | null> {
    const row = await this.repo.findOne({
      where: { id: id.value },
      relations: { clasificadores: true },
    });
    return row ? productoToDomain(row) : null;
  }

  async findByCodExt(codExt: number): Promise<Producto | null> {
    const row = await this.repo.findOne({
      where: { cod_ext: codExt },
      relations: { clasificadores: true },
    });
    return row ? productoToDomain(row) : null;
  }

  async save(producto: Producto): Promise<void> {
    await this.repo.save(productoFromDomain(producto));
    await this.syncClasificadores(producto);
  }

  async upsertMany(productos: Producto[]): Promise<void> {
    for (const p of productos) {
      await this.repo.save(productoFromDomain(p));
      await this.syncClasificadores(p);
    }
  }

  async list(params?: {
    search?: string;
    clasificador?: { tipo: TipoClasificador; idClasificador: string };
    limit?: number;
    offset?: number;
  }): Promise<{ items: Producto[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.clasificadores', 'pc');

    if (params?.search) {
      qb.andWhere({ nombre: ILike(`%${params.search}%`) });
    }
    if (params?.clasificador) {
      qb.andWhere('pc.tipo = :tipo AND pc.idClasificador = :id', {
        tipo: params.clasificador.tipo,
        id: params.clasificador.idClasificador,
      });
    }

    const total = await qb.getCount();

    if (params?.limit != null) qb.take(params.limit);
    if (params?.offset != null) qb.skip(params.offset);

    const rows = await qb.getMany();
    return { items: rows.map(productoToDomain), total };
  }
}
