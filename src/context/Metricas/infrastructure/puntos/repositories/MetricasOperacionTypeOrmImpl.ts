// infrastructure/repositories/MetricasOperacionTypeOrmRepository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MetricasOperacionRepository } from 'src/context/Metricas/core/puntos/repositories/MetricasOperacionRepository';
import { MetricasOperacion } from 'src/context/Metricas/core/puntos/entities/MetricasOperacion';
import { MetricasOperacionEntity } from '../entities/MetricasOperacionEntity';

@Injectable()
export class MetricasOperacionTypeOrmRepository
  implements MetricasOperacionRepository
{
  constructor(
    @InjectRepository(MetricasOperacionEntity)
    private readonly repo: Repository<MetricasOperacionEntity>,
  ) {}

  async save(metrica: MetricasOperacion): Promise<void> {
    await this.repo.save(MetricasOperacionEntity.fromDomain(metrica));
  }

  async findByFecha(fecha: Date): Promise<MetricasOperacion | null> {
    const entity = await this.repo.findOneBy({ fecha });
    return entity ? entity.toDomain() : null;
  }

  async findBetweenFechas(
    desde: Date,
    hasta: Date,
  ): Promise<MetricasOperacion[]> {
    const rows = await this.repo.find({
      where: { fecha: Between(desde, hasta) },
      order: { fecha: 'ASC' },
    });
    return rows.map((entity) => entity.toDomain());
  }
}
