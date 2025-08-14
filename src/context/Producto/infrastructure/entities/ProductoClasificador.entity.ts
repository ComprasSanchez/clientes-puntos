// infrastructure/persistence/typeorm/entities/ProductoClasificadorEntity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ClasificadorAsociado } from '../../core/entities/ClasificadorAsociado';
import { TipoClasificador } from '../../core/enums/TipoClasificador.enum';
import { ProductoEntity } from './Producto.entity';

// Entity
@Entity({ name: 'producto_clasificador' })
@Index(['productoId', 'tipo', 'idClasificador'], { unique: true })
export class ProductoClasificadorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'producto_id', type: 'varchar', unique: true })
  productoId!: string;

  @ManyToOne(() => ProductoEntity, (p) => p.clasificadores, {
    onDelete: 'CASCADE',
  })
  producto!: ProductoEntity;

  @Column({ type: 'int' })
  tipo!: number; // TipoClasificador

  @Column({
    name: 'id_clasificador',
    type: 'int',
    unique: true,
    nullable: false,
  })
  idClasificador!: number;

  @Column({ type: 'varchar', length: 300 })
  nombre!: string;
}

// ---------------------------
// Mapping helpers (infra <-> domain)
// ---------------------------

/** Convierte una fila TypeORM a la entidad de dominio ClasificadorAsociado */
export function toDomain(
  row: ProductoClasificadorEntity,
): ClasificadorAsociado {
  return new ClasificadorAsociado(
    row.tipo as TipoClasificador,
    row.idClasificador,
    row.nombre ?? '',
  );
}

/**
 * Convierte un clasificador de dominio a el shape persistible (DeepPartial) de TypeORM.
 * Nota: devolvemos un objeto “partial” que podés pasar a repo.save(...)
 */
export function fromDomain(
  productoId: string,
  c: ClasificadorAsociado,
): Partial<ProductoClasificadorEntity> {
  return {
    productoId,
    tipo: Number(c.tipo),
    idClasificador: c.idClasificador,
    nombre: c.nombre ?? '',
  };
}
