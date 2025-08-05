// /metricas/infrastructure/clientes/entities/ClienteMetricaEntity.ts

import { Entity, Column, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cliente_metricas' })
@Index(['clienteId', 'fecha'])
export class ClienteMetricaEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'cliente_id' })
  clienteId!: string;

  @Column({
    type: 'timestamp',
    name: 'fecha',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;

  @Column({ type: 'numeric', name: 'pesos_ahorro', default: 0 })
  pesosAhorro!: number;

  @Column({ type: 'numeric', name: 'puntos_adquiridos', default: 0 })
  puntosAdquiridos!: number;

  @Column({ type: 'integer', name: 'movimientos', default: 1 })
  movimientos!: number;

  @Column({ name: 'tipo_operacion', nullable: false })
  tipoOperacion!: string;

  @Column({ name: 'referencia_transaccion', nullable: true })
  referenciaTransaccion?: string;
}
