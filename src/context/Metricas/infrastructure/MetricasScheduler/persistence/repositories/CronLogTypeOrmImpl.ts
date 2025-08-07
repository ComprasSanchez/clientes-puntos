// infrastructure/repositories/MetricasCronLogTypeOrmRepository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { MetricasCronLogEntity } from '../entities/MetricasCronLogEntity';

@Injectable()
export class MetricasCronLogTypeOrmRepository {
  constructor(
    @InjectRepository(MetricasCronLogEntity)
    private readonly repo: Repository<MetricasCronLogEntity>,
  ) {}

  async createLog(
    log: Partial<MetricasCronLogEntity>,
  ): Promise<MetricasCronLogEntity> {
    const created = this.repo.create(log);
    return await this.repo.save(created);
  }

  async updateLog(
    id: number,
    updates: Partial<MetricasCronLogEntity>,
  ): Promise<MetricasCronLogEntity | null> {
    await this.repo.update(id, updates);
    return await this.repo.findOneBy({ id });
  }

  async findById(id: number): Promise<MetricasCronLogEntity | null> {
    return await this.repo.findOneBy({ id });
  }

  async findMany(
    options?: FindManyOptions<MetricasCronLogEntity>,
  ): Promise<MetricasCronLogEntity[]> {
    return await this.repo.find(options);
  }

  async findLatestByJob(
    jobName: string,
    limit = 10,
  ): Promise<MetricasCronLogEntity[]> {
    return await this.repo.find({
      where: { jobName },
      order: { startTime: 'DESC' },
      take: limit,
    });
  }
}
