import { OpTipo } from '@shared/core/enums/OpTipo';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { Operacion } from '../../core/entities/Operacion';
import { OrigenOperacion } from '../../core/value-objects/OrigenOperacion';
import { FechaOperacion } from '../../core/value-objects/FechaOperacion';
import { OperacionId } from '../../core/value-objects/OperacionId';
import { CantidadPuntos } from '../../core/value-objects/CantidadPuntos';
import { MontoMoneda } from '../../core/value-objects/MontoMoneda';
import { Moneda } from '../../core/value-objects/Moneda';
import { ReferenciaMovimiento } from '../../core/value-objects/ReferenciaMovimiento';

@Entity({ name: 'operaciones' })
export class OperacionEntity {
  @PrimaryColumn('bigint')
  id: number;

  @Column('uuid')
  clienteId: string;

  @Column({ type: 'enum', enum: OpTipo, enumName: 'operacion_tipo_enum' })
  tipo: OpTipo;

  @Column('timestamp')
  fecha: Date;

  @Column('varchar', { length: 50 })
  origenTipo: string;

  @Column('int', { nullable: true })
  puntos: number | null;

  @Column('numeric', { nullable: true })
  monto: number | null;

  @Column({
    type: 'enum',
    enum: TipoMoneda,
    enumName: 'operacion_moneda_enum',
    nullable: true,
  })
  moneda: TipoMoneda | null;

  @Column('varchar', { length: 50, nullable: true })
  refOperacion: string | null;

  @Column('bigint', { nullable: true })
  refAnulacion: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDomain(): Operacion {
    return new Operacion(
      OperacionId.instance(this.id),
      this.clienteId,
      this.tipo,
      new FechaOperacion(this.fecha),
      new OrigenOperacion(this.origenTipo),
      this.puntos !== null ? new CantidadPuntos(this.puntos) : undefined,
      this.monto !== null ? new MontoMoneda(this.monto) : undefined,
      this.moneda !== null ? Moneda.create(this.moneda) : undefined,
      this.refOperacion !== null
        ? new ReferenciaMovimiento(this.refOperacion)
        : undefined,
      this.refAnulacion !== null
        ? OperacionId.instance(this.refAnulacion)
        : undefined,
    );
  }

  static fromDomain(operacion: Operacion): OperacionEntity {
    const entity = new OperacionEntity();
    entity.id = operacion.id.value;
    entity.clienteId = operacion.clienteId;
    entity.tipo = operacion.tipo;
    entity.fecha = operacion.fecha.value;
    entity.origenTipo = operacion.origenTipo.value;
    entity.puntos = operacion.puntos?.value ?? null;
    entity.monto = operacion.monto?.value ?? null;
    entity.moneda = operacion.moneda?.value ?? null;
    entity.refOperacion = operacion.refOperacion?.value ?? null;
    entity.refAnulacion = operacion.refAnulacion?.value ?? null;
    return entity;
  }
}
