// src/infrastructure/typeorm/entities/HistorialSaldoCliente.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'historial_saldo_cliente' })
export class HistorialSaldoCliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  cliente_id: string;

  @Column({ type: 'int' })
  saldo_anterior: number;

  @Column({ type: 'int' })
  saldo_nuevo: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  motivo: string;

  @Column({ type: 'bigint', nullable: true })
  referencia_operacion: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_cambio: Date;
}
