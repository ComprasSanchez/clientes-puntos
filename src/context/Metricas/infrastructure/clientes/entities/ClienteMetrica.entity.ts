import { Entity, Column, Index, PrimaryColumn } from 'typeorm';
import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';
import { OpTipo } from '@shared/core/enums/OpTipo';

@Entity({ name: 'cliente_metricas' })
@Index(['clienteId', 'fecha'])
export class ClienteMetricaEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'cliente_id' })
  clienteId!: string;

  @Column({
    type: 'timestamp',
    name: 'fecha',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;

  @Column({ type: 'numeric', name: 'pesos_ahorro', default: 0 })
  pesosAhorro!: number;

  @Column({ type: 'numeric', name: 'puntos_adquiridos', default: 0 })
  puntosAdquiridos!: number;

  @Column({ name: 'tipo_operacion', nullable: false })
  tipoOperacion!: string;

  @Column({ name: 'referencia_transaccion', nullable: true })
  referenciaTransaccion?: number;

  // ---------- Métodos de mapeo ----------

  static fromDomain(domain: ClienteMetrica): ClienteMetricaEntity {
    const entity = new ClienteMetricaEntity();
    entity.id = domain.id;
    entity.clienteId = domain.clienteId;
    entity.fecha = domain.fecha;
    entity.pesosAhorro = domain.pesosAhorro;
    entity.puntosAdquiridos = domain.puntosAdquiridos;
    entity.tipoOperacion = domain.tipoOperacion;
    entity.referenciaTransaccion = domain.referenciaTransaccion;
    return entity;
  }

  toDomain(): ClienteMetrica {
    return new ClienteMetrica(
      this.id,
      this.clienteId,
      this.fecha,
      Number(this.pesosAhorro),
      Number(this.puntosAdquiridos),
      this.tipoOperacion as OpTipo,
      this.referenciaTransaccion,
    );
  }
}
