import { Sucursal } from 'src/context/Sucursal/core/entities/Sucursal';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'sucursales' })
@Index('ux_sucursales_codigo', ['codigo'], { unique: true })
export class SucursalEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  codigo!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  static fromDomain(domain: Sucursal): SucursalEntity {
    const orm = new SucursalEntity();
    orm.id = domain.id;
    orm.codigo = domain.codigo;
    orm.nombre = domain.nombre;
    return orm;
  }

  static toDomain(orm: SucursalEntity): Sucursal {
    // rehidratar mantiene TS puro en dominio
    return Sucursal.rehidratar(orm.id, orm.codigo, orm.nombre);
  }
}
