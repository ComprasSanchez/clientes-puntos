// src/context/cliente/infrastructure/persistence/entities/ClienteEntity.ts
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Mapeo ORM de la tabla cliente para TypeORM
 */
@Entity({ name: 'cliente' })
export class ClienteEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  dni: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'char', length: 1 })
  sexo: string;

  @Column({ name: 'fec_nacimiento', type: 'date' })
  fecNacimiento: Date;

  @Column({ name: 'status_cliente', type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'varchar', length: 50 })
  categoria: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion: string | null;

  @Column({ name: 'cod_postal', type: 'varchar', length: 10, nullable: true })
  codPostal: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  localidad: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provincia: string | null;

  @Column({ name: 'id_fidely', type: 'varchar', length: 50, nullable: true })
  idFidely: string | null;

  @Column({
    name: 'tarjeta_fidely',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  tarjetaFidely: string | null;

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
}
