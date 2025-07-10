// src/infrastructure/typeorm/entities/SaldoCliente.entity.ts
import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'saldo_cliente' })
export class SaldoCliente {
  @PrimaryColumn('uuid')
  cliente_id: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  saldo_total: number;

  @UpdateDateColumn({ type: 'timestamp' })
  fecha_ultimo_movimiento: Date;
}
