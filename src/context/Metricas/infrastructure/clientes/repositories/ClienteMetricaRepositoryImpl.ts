// /metricas/infrastructure/clientes/repositories/ClienteMetricaRepositoryImpl.ts

import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ClienteMetricaRepository } from 'src/context/Metricas/core/clientes/repositories/ClienteMetrica.repository';
import { Repository, Between, DataSource } from 'typeorm';
import { ClienteMetricaEntity } from '../entities/ClienteMetrica.entity';
import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';

@Injectable()
export class ClienteMetricaRepositoryImpl implements ClienteMetricaRepository {
  constructor(
    @InjectRepository(ClienteMetricaEntity)
    private readonly repo: Repository<ClienteMetricaEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async save(metrica: ClienteMetrica): Promise<void> {
    const entity = ClienteMetricaEntity.fromDomain(metrica);
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
    return items.map((item) => item.toDomain());
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
    return items.map((item) => item.toDomain());
  }
}
