import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { FindOptionsWhere, Repository } from 'typeorm';
import { LoteEntity } from '../../entities/lote.entity';
import { Lote } from '@puntos/core/entities/Lote';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { BatchEstado } from '@puntos/core/enums/BatchEstado';

@Injectable()
export class TypeOrmLoteRepository implements LoteRepository {
  constructor(
    @InjectRepository(LoteEntity)
    private readonly repo: Repository<LoteEntity>,
  ) {}

  async findAll(): Promise<Lote[]> {
    const entities = await this.repo.find();
    return entities.map((e) => e.toDomain());
  }

  async findById(id: LoteId): Promise<Lote | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? entity.toDomain() : null;
  }

  async findByCliente(
    clienteId: string,
    estado?: BatchEstado,
  ): Promise<Lote[]> {
    const where: FindOptionsWhere<LoteEntity> = { clienteId };
    if (estado) where.estado = estado;
    const entities = await this.repo.find({ where });
    return entities.map((e) => e.toDomain());
  }

  async save(lote: Lote): Promise<void> {
    await this.repo.insert(LoteEntity.fromDomain(lote));
  }

  async update(lote: Lote): Promise<void> {
    await this.repo.save(LoteEntity.fromDomain(lote));
  }

  async delete(id: LoteId): Promise<void> {
    await this.repo.delete({ id: id.value });
  }
}
