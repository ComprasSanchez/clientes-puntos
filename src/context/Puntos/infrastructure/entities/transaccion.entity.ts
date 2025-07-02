import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransaccionId } from '../../core/value-objects/TransaccionId';
import { OperacionId } from '../../core/value-objects/OperacionId';
import { LoteId } from '../../core/value-objects/LoteId';
import { TxTipo } from '../../core/enums/TxTipo';
import { CantidadPuntos } from '../../core/value-objects/CantidadPuntos';
import { ReferenciaMovimiento } from '../../core/value-objects/ReferenciaMovimiento';
import { Transaccion } from '../../core/entities/Transaccion';

@Entity({ name: 'transacciones' })
export class TransaccionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  operationId: number;

  @Column('uuid')
  loteId: string;

  @Column({ type: 'simple-enum', enum: TxTipo })
  tipo: TxTipo;

  @Column('int')
  cantidad: number;

  @Column('uuid', { nullable: true })
  referenciaId: string | null;

  @Column('jsonb')
  reglasAplicadas: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDomain(): Transaccion {
    return new Transaccion(
      new TransaccionId(this.id),
      OperacionId.instance(this.operationId),
      new LoteId(this.loteId),
      this.tipo,
      new CantidadPuntos(this.cantidad),
      this.createdAt,
      this.referenciaId
        ? new ReferenciaMovimiento(this.referenciaId)
        : undefined,
    );
  }

  static fromDomain(trans: Transaccion): TransaccionEntity {
    const e = new TransaccionEntity();
    e.id = trans.id.value;
    e.operationId = trans.operationId.value;
    e.loteId = trans.loteId.value;
    e.tipo = trans.tipo;
    e.cantidad = trans.cantidad.value;
    e.referenciaId = trans.referenciaId?.value ?? null;
    e.createdAt = trans.createdAt;
    e.updatedAt = trans.updatedAt;
    return e;
  }
}
