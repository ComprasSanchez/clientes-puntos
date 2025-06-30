import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { ClienteEntity } from './ClienteEntity';

@Entity({ name: 'categoria' })
export class CategoriaEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @OneToMany(() => ClienteEntity, (cliente) => cliente.categoria)
  clientes: ClienteEntity[];
}
