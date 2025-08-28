// infrastructure/persistence/typeorm/entities/Clasificador.entity.ts
import { Entity, PrimaryColumn, Column, Index, OneToMany } from 'typeorm';
import { ProductoClasificadorEntity } from './ProductoClasificador.entity';

// PK compuesta (tipo, id_externo)
@Entity({ name: 'clasificador' })
@Index(['tipo', 'idExterno'], { unique: true })
export class ClasificadorEntity {
  @PrimaryColumn({ type: 'int' })
  tipo!: number;

  @PrimaryColumn({ name: 'id_externo', type: 'int' })
  idExterno!: number;

  @Column({ type: 'varchar', length: 300 })
  nombre!: string;

  @OneToMany(() => ProductoClasificadorEntity, (pc) => pc.clasificador)
  productos!: ProductoClasificadorEntity[];
}
