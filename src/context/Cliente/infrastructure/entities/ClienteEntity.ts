import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusCliente } from '@cliente/core/enums/StatusCliente';
import { CategoriaEntity } from './CategoriaEntity';

@Entity({ name: 'cliente' })
export class ClienteEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  dni: string;

  @Column({
    name: 'status_cliente',
    type: 'enum',
    enum: StatusCliente,
    default: StatusCliente.Activo,
  })
  status: StatusCliente;

  @Column({
    name: 'id_fidely',
    type: 'int',
    nullable: true,
    default: () => "nextval('cliente_id_fidely_seq_nuevo_sistema')",
  })
  idFidely?: number | null;

  @Column({
    name: 'tarjeta_fidely',
    type: 'varchar',
    length: 20,
  })
  tarjetaFidely: string;

  @Column({
    name: 'fecha_alta',
    type: 'timestamp with time zone',
    default: () => 'now()',
  })
  fechaAlta: Date;

  @Column({
    name: 'fecha_baja',
    type: 'timestamp with time zone',
    nullable: true,
  })
  fechaBaja: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => CategoriaEntity, (cat) => cat.clientes, { eager: true })
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaEntity;
}
