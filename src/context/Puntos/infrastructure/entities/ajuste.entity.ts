import { TxTipo } from '@puntos/core/enums/TxTipo';
import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ajustes_log' })
export class AjusteEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  usuarioId: string;

  @Column('uuid')
  clienteId: string;

  @Column({ type: 'enum', enum: TxTipo, enumName: 'ajuste_tipo_enum' })
  tipo: TxTipo;

  @Column()
  cantidad: number;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @CreateDateColumn()
  fecha: Date;
}
