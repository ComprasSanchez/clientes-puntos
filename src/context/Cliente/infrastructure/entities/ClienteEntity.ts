import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusCliente } from '@cliente/core/enums/StatusCliente';
import { CategoriaEntity } from './CategoriaEntity';

@Entity({ name: 'cliente' })
@Index('idx_cliente_novedad_plex_at', ['novedadPlexAt'])
@Index('idx_cliente_novedad_plex_pendiente', ['novedadPlexPendienteDesde'], {
  where: '"novedad_plex_pendiente_desde" IS NOT NULL',
})
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

  /**
   * Momento en que el cliente se publica como novedad para Plex
   * (ConsultarNovedadesCliente filtra por esta columna, no por updated_at).
   * Lo pone el liberador de novedades, de a lotes.
   */
  @Column({
    name: 'novedad_plex_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  novedadPlexAt?: Date | null;

  /**
   * Desde cuándo el cliente tiene un cambio pendiente de informar a Plex.
   * NULL = nada pendiente. Varios cambios seguidos conservan la primera fecha.
   */
  @Column({
    name: 'novedad_plex_pendiente_desde',
    type: 'timestamp with time zone',
    nullable: true,
  })
  novedadPlexPendienteDesde?: Date | null;

  @ManyToOne(() => CategoriaEntity, (cat) => cat.clientes, { eager: true })
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaEntity;
}
