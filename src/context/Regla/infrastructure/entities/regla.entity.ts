import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  TableInheritance,
} from 'typeorm';
import { TipoRegla } from '../../core/enums/TipoRegla';
import { Regla } from '@regla/core/entities/Regla';

/**
 * Entidad base para todas las reglas.
 * Usa Single Table Inheritance (STI) por el campo `tipo`.
 */
@Entity({ name: 'reglas' })
@TableInheritance({
  column: {
    name: 'tipo',
    type: 'enum',
    enum: TipoRegla,
    enumName: 'reglas_tipo_enum',
  },
})
export abstract class ReglaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({
    type: 'enum',
    enum: TipoRegla,
    enumName: 'reglas_tipo_enum',
  })
  tipo!: TipoRegla;

  @Column('int')
  prioridad!: number;

  @Column({ type: 'boolean' })
  activa!: boolean;

  @Column({ type: 'boolean' })
  excluyente!: boolean;

  @Column()
  vigenciaInicio!: Date;

  @Column({ type: 'timestamp', nullable: true })
  vigenciaFin?: Date;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  abstract toDomain(): Regla;
}
