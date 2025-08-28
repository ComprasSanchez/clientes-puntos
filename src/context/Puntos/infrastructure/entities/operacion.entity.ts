// @puntos/infrastructure/typeorm/entities/Operacion.entity.ts
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
import { DecimalToNumberTransformer } from '@shared/infrastructure/transformers/decimal-to-number.transformer';

// 🔹 shape JSON que se guarda en DB
export interface CarritoDbItem {
  codExt: number;
  cantidad: number;
  precio: number; // unitario en la misma moneda de la operación
}

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

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
    transformer: new DecimalToNumberTransformer(), // 👈 instancia, no la clase
  })
  monto!: number | null;

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

  @Column('varchar', { nullable: true })
  codSucursal: string | null;

  // 🔹 NUEVO: carrito JSONB
  @Column('jsonb', { nullable: true })
  items: CarritoDbItem[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDomain(): Operacion {
    // map JSON → dominio (mantener números seguros)
    const items =
      this.items?.map((i) => ({
        codExt: i.codExt,
        cantidad: Math.max(1, Number(i.cantidad ?? 1)),
        precio: Number(i.precio ?? 0),
      })) ?? undefined;

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
      this.codSucursal ?? undefined,
      // 🔹 pasar carrito al dominio (último parámetro del ctor)
      items,
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
    entity.codSucursal = operacion.codSucursal ?? null;

    // 🔹 dominio → JSON
    const items = operacion.items?.map((it) => ({
      codExt: it.codExt,
      cantidad: it.cantidad,
      precio: it.precio,
    }));
    entity.items = items && items.length > 0 ? items : null;

    return entity;
  }
}
