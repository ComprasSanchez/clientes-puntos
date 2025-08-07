// infrastructure/entities/MetricasOperacionEntity.ts

import { MetricasOperacion } from 'src/context/Metricas/core/puntos/entities/MetricasOperacion';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('metricas_operacion')
export class MetricasOperacionEntity {
  @PrimaryColumn({ type: 'date' })
  fecha: Date;

  @Column({ type: 'integer' })
  cantidadOperaciones: number;

  @Column({ type: 'integer' })
  puntosAcreditados: number;

  @Column({ type: 'integer' })
  puntosGastados: number;

  @Column({ type: 'integer', name: 'compra' })
  compra: number;

  @Column({ type: 'integer', name: 'devolucion' })
  devolucion: number;

  @Column({ type: 'integer', name: 'anulacion' })
  anulacion: number;

  @Column({ type: 'integer', name: 'ajuste' })
  ajuste: number;

  // ------ Métodos de mapping ------
  static fromDomain(domain: MetricasOperacion): MetricasOperacionEntity {
    const entity = new MetricasOperacionEntity();
    entity.fecha = domain.fecha;
    entity.cantidadOperaciones = domain.cantidadOperaciones;
    entity.puntosAcreditados = domain.puntosAcreditados;
    entity.puntosGastados = domain.puntosGastados;
    entity.compra = domain.distribucionOperaciones.compra;
    entity.devolucion = domain.distribucionOperaciones.devolucion;
    entity.anulacion = domain.distribucionOperaciones.anulacion;
    entity.ajuste = domain.distribucionOperaciones.ajuste;
    return entity;
  }

  toDomain(): MetricasOperacion {
    return new MetricasOperacion(
      this.fecha,
      this.cantidadOperaciones,
      this.puntosAcreditados,
      this.puntosGastados,
      {
        compra: this.compra,
        devolucion: this.devolucion,
        anulacion: this.anulacion,
        ajuste: this.ajuste,
      },
    );
  }
}
