import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('integracion_movimiento')
export class IntegracionMovimientoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  tipoIntegracion: string;

  @Column({ length: 20 })
  txTipo: string;

  @Column({ type: 'jsonb' })
  requestPayload: object;

  @Column({ type: 'jsonb', nullable: true })
  responsePayload?: object;

  @Column({ length: 20 })
  status: string;

  @Column({ type: 'text', nullable: true })
  mensajeError?: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
