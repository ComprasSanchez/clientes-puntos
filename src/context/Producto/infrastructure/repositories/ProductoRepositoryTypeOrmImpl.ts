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

  // --- HELPERS PRIVADOS ---

  private async syncClasificadores(p: Producto): Promise<void> {
    const current = await this.repoClas.find({
      where: { productoId: p.id.value },
    });

    const desiredKeys = new Set(
      p.clasificadores.map((c) =>
        key(p.id.value, Number(c.tipo), c.idClasificador),
      ),
    );

    // borrar los que no están en dominio
    for (const c of current) {
      if (!desiredKeys.has(key(c.productoId, c.tipo, c.idClasificador))) {
        await this.repoClas.delete(c.id);
      }
    }

    // upsert los deseados
    for (const c of p.clasificadores) {
      await this.repoClas.save(clasifFromDomain(p.id.value, c));
    }
  }

  // --- REPO CONTRACT ---

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
    // Persistir base
    await this.repo.save(productoFromDomain(producto));
    // Sincronizar clasificadores
    await this.syncClasificadores(producto);

    // Si querés auditar "motivo", este es un buen punto para enviar a un outbox/log.
    // p.ej.: await this.auditRepo.insert({ productoId: producto.id.value, motivo: meta?.motivo ?? null, ... })
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

const key = (pid: string, tipo: number, idc: number) =>
  `${pid}::${tipo}::${idc}`;
