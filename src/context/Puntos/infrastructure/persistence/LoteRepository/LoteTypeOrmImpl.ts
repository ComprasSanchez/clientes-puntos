import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { FindOptionsWhere, Repository } from 'typeorm';
import { LoteEntity } from '../../entities/lote.entity';
import { Lote } from '@puntos/core/entities/Lote';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { BatchEstado } from '@puntos/core/enums/BatchEstado';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { TypeOrmBaseRepository } from '@shared/infrastructure/transaction/TypeOrmBaseRepository';

@Injectable()
export class TypeOrmLoteRepository
  extends TypeOrmBaseRepository
  implements LoteRepository
{
  constructor(
    @InjectRepository(LoteEntity)
    private readonly repo: Repository<LoteEntity>,
  ) {
    super();
  }

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
    const entities = await this.repo.find({
      where,
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => e.toDomain());
  }

  async save(lote: Lote, ctx?: TransactionContext): Promise<void> {
    const entity = LoteEntity.fromDomain(lote);
    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.insert(LoteEntity, entity);
    } else {
      await this.repo.insert(entity);
    }
  }

  async update(lote: Lote, ctx?: TransactionContext): Promise<void> {
    const entity = LoteEntity.fromDomain(lote);
    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.save(LoteEntity, entity);
    } else {
      await this.repo.save(entity);
    }
  }

  async delete(id: LoteId, ctx?: TransactionContext): Promise<void> {
    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.delete(LoteEntity, { id: id.value });
    } else {
      await this.repo.delete({ id: id.value });
    }
  }
}
