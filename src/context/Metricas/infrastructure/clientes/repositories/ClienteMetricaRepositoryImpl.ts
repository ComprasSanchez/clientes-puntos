// /metricas/infrastructure/clientes/repositories/ClienteMetricaRepositoryImpl.ts

import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ClienteMetricaRepository } from 'src/context/Metricas/core/clientes/repositories/ClienteMetrica.repository';
import { Repository, Between, DataSource } from 'typeorm';
import { ClienteMetricaEntity } from '../entities/ClienteMetrica.entity';
import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';
import { OpTipo } from '@shared/core/enums/OpTipo';

@Injectable()
export class ClienteMetricaRepositoryImpl implements ClienteMetricaRepository {
  constructor(
    @InjectRepository(ClienteMetricaEntity)
    private readonly repo: Repository<ClienteMetricaEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async save(metrica: ClienteMetrica): Promise<void> {
    const entity = this.toEntity(metrica);

    await this.dataSource.manager.transaction(async (manager) => {
      await manager.getRepository(ClienteMetricaEntity).save(entity);
    });
  }

  async findByClienteIdAndDateRange(
    clienteId: string,
    desde: Date,
    hasta: Date,
  ): Promise<ClienteMetrica[]> {
    const items = await this.repo.find({
      where: {
        clienteId,
        fecha: Between(desde, hasta),
      },
      order: { fecha: 'ASC' },
    });
    return items.map((item) => this.toDomain(item));
  }

  async findByDniAndDateRange(
    dni: string,
    desde: Date,
    hasta: Date,
  ): Promise<ClienteMetrica[]> {
    // Si clienteId es el DNI, se busca igual
    const items = await this.repo.find({
      where: {
        clienteId: dni,
        fecha: Between(desde, hasta),
      },
      order: { fecha: 'ASC' },
    });
    return items.map((item) => this.toDomain(item));
  }

  // ------ Mapeo entre entidad y dominio ------
  private toEntity(domain: ClienteMetrica): ClienteMetricaEntity {
    const entity = new ClienteMetricaEntity();
    entity.id = domain.id;
    entity.clienteId = domain.clienteId;
    entity.fecha = domain.fecha;
    entity.pesosAhorro = domain.pesosAhorro;
    entity.puntosAdquiridos = domain.puntosAdquiridos;
    entity.movimientos = domain.movimientos;
    entity.tipoOperacion = domain.tipoOperacion;
    entity.referenciaTransaccion = domain.referenciaTransaccion;
    return entity;
  }

  private toDomain(entity: ClienteMetricaEntity): ClienteMetrica {
    return new ClienteMetrica(
      entity.id,
      entity.clienteId,
      entity.fecha,
      Number(entity.pesosAhorro),
      Number(entity.puntosAdquiridos),
      entity.movimientos,
      entity.tipoOperacion as OpTipo,
      entity.referenciaTransaccion,
    );
  }
}
