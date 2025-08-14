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
  ) {}

  async findById(id: ProductoId): Promise<Producto | null> {
    const row = await this.repo.findOne({ where: { id: id.value } });
    return row ? productoToDomain(row) : null;
  }

  async upsertMany(productos: Producto[]): Promise<void> {
    for (const p of productos) {
      // Upsert base del producto
      await this.repo.save(productoFromDomain(p));

      // Sincronía manual de clasificadores (evita depender de PK de hijos)
      const current = await this.repoClas.find({
        where: { productoId: p.id.value },
      });
      const desiredKeys = new Set(
        p.clasificadores.map((c) =>
          key(p.id.value, Number(c.tipo), c.idClasificador),
        ),
      );

      // Borrar los que ya no están
      for (const c of current) {
        if (!desiredKeys.has(key(c.productoId, c.tipo, c.idClasificador))) {
          await this.repoClas.delete(c.id);
        }
      }

      // Upsert nuevos/actualizados
      for (const c of p.clasificadores) {
        await this.repoClas.save(clasifFromDomain(p.id.value, c));
      }
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

    if (params?.limit) qb.take(params.limit);
    if (params?.offset) qb.skip(params.offset);

    const rows = await qb.getMany();
    return { items: rows.map(productoToDomain), total };
  }
}

const key = (pid: string, tipo: number, idc: number) =>
  `${pid}::${tipo}::${idc}`;
