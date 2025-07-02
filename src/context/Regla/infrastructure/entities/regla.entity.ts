/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { ConversionRuleEntity } from './rule-conversion.entity';

/**
 * Entidad base para todas las reglas.
 * Usa Single Table Inheritance (STI) por el campo `tipo`.
 */
@Entity({ name: 'reglas' })
@TableInheritance({ column: { name: 'tipo', type: 'enum', enum: TipoRegla } })
export abstract class ReglaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({ type: 'enum', enum: TipoRegla })
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

  /**
   * Factory: instanciar la entidad correcta según el tipo de dominio
   */
  static fromDomain(regla: Regla): ReglaEntity {
    switch (regla.tipo.value) {
      case TipoRegla.CONVERSION:
        // conversión a ConversionRuleEntity
        return ConversionRuleEntity.fromDomain(regla as ConversionRule);
      // caso futuros: TipoRegla.XXXXX => OtraRuleEntity.fromDomain(...)
      default:
        throw new Error(`Tipo de regla no soportado: ${regla.tipo.value}`);
    }
  }
}
