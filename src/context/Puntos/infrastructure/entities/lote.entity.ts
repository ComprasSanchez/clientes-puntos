import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BatchEstado } from '../../core/enums/BatchEstado';
import { Lote } from '../../core/entities/Lote';
import { LoteId } from '../../core/value-objects/LoteId';
import { CantidadPuntos } from '../../core/value-objects/CantidadPuntos';
import { FechaExpiracion } from '../../core/value-objects/FechaExpiracion';
import { OrigenOperacion } from '../../core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '../../core/value-objects/ReferenciaMovimiento';

@Entity({ name: 'lotes' })
export class LoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clienteId: string;

  @Column('int')
  cantidadOriginal: number;

  @Column('int')
  remaining: number;

  @Column({ type: 'simple-enum', enum: BatchEstado })
  estado: BatchEstado;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  expiraEn: Date | null;

  @Column()
  origenTipo: string;

  @Column('uuid', { nullable: true })
  referenciaId: string | null;

  toDomain(): Lote {
    return new Lote(
      new LoteId(this.id),
      this.clienteId,
      new CantidadPuntos(this.cantidadOriginal),
      new CantidadPuntos(this.remaining),
      this.estado,
      this.createdAt,
      this.expiraEn ? new FechaExpiracion(this.expiraEn) : null,
      new OrigenOperacion(this.origenTipo),
      this.referenciaId
        ? new ReferenciaMovimiento(this.referenciaId)
        : undefined,
    );
  }

  static fromDomain(lote: Lote): LoteEntity {
    const e = new LoteEntity();
    e.id = lote.id.value;
    e.clienteId = lote.clienteId;
    e.cantidadOriginal = lote.cantidadOriginal.value;
    e.remaining = lote.remaining.value;
    e.estado = lote.estado;
    e.createdAt = lote.createdAt;
    e.updatedAt = lote.updatedAt;
    e.expiraEn = lote.expiraEn ? lote.expiraEn.value : null;
    e.origenTipo = lote.origenTipo.value;
    e.referenciaId = lote.referenciaId ? lote.referenciaId.value : null;
    return e;
  }
}
