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
import { DecimalToNumberTransformer } from '@shared/infrastructure/transformers/decimal-to-number.transformer';

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

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: new DecimalToNumberTransformer(),
  })
  costo!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: new DecimalToNumberTransformer(),
  })
  precio!: number;

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

const asFinite = (n: any, def = 0): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : def;

/** TypeORM -> Dominio */
export function toDomain(row: ProductoEntity): Producto {
  return Producto.create({
    id: ProductoId.from(row.id),
    codExt: row.cod_ext, // si usás autogen, este valor viene de DB
    nombre: NombreProducto.from(row.nombre),
    presentacion: Presentacion.from(row.presentacion ?? ''),
    costo: Dinero.from(asFinite(row.costo, 0)),
    precio: Dinero.from(asFinite(row.precio, 0)),
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
    // Si **NO** autogenerás cod_ext (Opción A):
    // cod_ext: p.codExt, // asegurate que p.codExt sea int válido en dominio

    // Si **SÍ** autogenerás (Opción B), NO seteés cod_ext aquí
    nombre: p.nombre.value,
    presentacion: p.presentacion.value ?? '',
    costo: p.costo.value, // transformer lo guarda bien
    precio: p.precio.value, // transformer lo guarda bien
    activo: p.activo,
  };

  if (opts?.includeChildren) {
    base.clasificadores = p.clasificadores.map((c: ClasificadorAsociado) =>
      fromClasificadorDomain(p.id.value, c),
    );
  }

  return base;
}
