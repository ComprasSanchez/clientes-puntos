import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';
import { ClienteEntity } from './ClienteEntity';

@Entity({ name: 'categoria' })
export class CategoriaEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int', unique: true }) // opcionalmente unique si querés garantizar unicidad
  @Generated('increment')
  codExt: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ClienteEntity, (cliente) => cliente.categoria)
  clientes: ClienteEntity[];
}
