// infrastructure/persistence/typeorm/entities/ProductoEntity.ts
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import {
  ProductoClasificadorEntity,
  toDomain as toClasificadorDomain,
  fromDomain as fromClasificadorDomain,
} from './ProductoClasificador.entity';
import { Producto } from '../../core/entities/Producto';
import { ProductoId } from '../../core/value-objects/ProductoId';
import { NombreProducto } from '../../core/value-objects/NombreProducto';
import { Presentacion } from '../../core/value-objects/Presentacion';
import { Dinero } from '../../core/value-objects/Dinero';
import { ClasificadorAsociado } from '../../core/entities/ClasificadorAsociado';

@Entity({ name: 'producto' })
export class ProductoEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string; // IdProducto externo

  @Column({ type: 'int', unique: true, nullable: false })
  cod_ext: number;

  @Column({ type: 'varchar', length: 300 })
  nombre!: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  presentacion!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  precio!: string;

  @Column({ default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ProductoClasificadorEntity, (pc) => pc.producto, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  clasificadores!: Partial<ProductoClasificadorEntity>[];
}

// ---------------------------
// Mapping helpers (infra <-> domain)
// ---------------------------

/** TypeORM -> Dominio */
export function toDomain(row: ProductoEntity): Producto {
  return Producto.create({
    id: ProductoId.from(row.id),
    codExt: row.cod_ext,
    nombre: NombreProducto.from(row.nombre),
    presentacion: Presentacion.from(row.presentacion),
    costo: Dinero.from(Number(row.costo)),
    precio: Dinero.from(Number(row.precio)),
    clasificadores: (row.clasificadores ?? []).map(toClasificadorDomain),
    activa: row.activo,
    createdAt: row.createdAt,
  });
}

/** Dominio -> TypeORM (DeepPartial) */
export function fromDomain(
  p: Producto,
  opts?: { includeChildren?: boolean },
): Partial<ProductoEntity> {
  const base: Partial<ProductoEntity> = {
    id: p.id.value,
    cod_ext: p.codExt,
    nombre: p.nombre.value,
    presentacion: p.presentacion.value,
    costo: String(p.costo.value),
    precio: String(p.precio.value),
  };

  if (opts?.includeChildren) {
    base.clasificadores = p.clasificadores.map((c: ClasificadorAsociado) =>
      fromClasificadorDomain(p.id.value, c),
    );
  }

  return base;
}
