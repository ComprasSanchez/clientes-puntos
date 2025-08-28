// infrastructure/persistence/typeorm/entities/ProductoClasificador.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { ClasificadorAsociado } from '../../core/entities/ClasificadorAsociado';
import { TipoClasificador } from '../../core/enums/TipoClasificador.enum';
import { ProductoEntity } from './Producto.entity';
import { ClasificadorEntity } from './Clasificador.entity';

@Entity({ name: 'producto_clasificador' })
@Index(['productoId', 'tipo', 'idClasificador'], { unique: true })
export class ProductoClasificadorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'producto_id', type: 'varchar' })
  productoId!: string;

  @ManyToOne(() => ProductoEntity, (p) => p.clasificadores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: ProductoEntity;

  @Column({ type: 'int' })
  tipo!: number;

  @Column({ name: 'id_clasificador', type: 'int' })
  idClasificador!: number;

  // Maestro del clasificador (FK compuesta)
  @ManyToOne(() => ClasificadorEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'tipo', referencedColumnName: 'tipo' },
    { name: 'id_clasificador', referencedColumnName: 'idExterno' },
  ])
  clasificador!: ClasificadorEntity;
}

// ---------------------------
// Mapping helpers (infra <-> domain)
// ---------------------------

export function toDomain(
  row: ProductoClasificadorEntity,
): ClasificadorAsociado {
  return new ClasificadorAsociado(
    row.tipo as TipoClasificador,
    row.idClasificador,
    row.clasificador?.nombre ?? '', // 👈 nombre desde el maestro
  );
}

export function fromDomain(
  productoId: string,
  c: ClasificadorAsociado,
): Partial<ProductoClasificadorEntity> {
  return {
    productoId,
    tipo: Number(c.tipo),
    idClasificador: c.idClasificador,
    // ❌ ya no seteamos 'nombre' aquí (vive en el maestro)
  };
}
