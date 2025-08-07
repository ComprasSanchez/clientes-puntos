import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TransaccionEntity } from '../../entities/transaccion.entity';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { TypeOrmBaseRepository } from '@shared/infrastructure/transaction/TypeOrmBaseRepository';

@Injectable()
export class TypeOrmTransaccionRepository
  extends TypeOrmBaseRepository
  implements TransaccionRepository
{
  constructor(
    @InjectRepository(TransaccionEntity)
    private readonly repo: Repository<TransaccionEntity>,
  ) {
    super();
  }

  async findAll(): Promise<Transaccion[]> {
    const entities: TransaccionEntity[] = await this.repo.find();
    return entities.map((e) => e.toDomain());
  }

  async findById(id: TransaccionId): Promise<Transaccion | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } });
    return entity ? entity.toDomain() : null;
  }

  async findByLote(loteId: LoteId): Promise<Transaccion[]> {
    const where: FindOptionsWhere<TransaccionEntity> = { loteId: loteId.value };
    const entities: TransaccionEntity[] = await this.repo.find({ where });
    return entities.map((e) => e.toDomain());
  }

  async findByCliente(clienteId: string): Promise<Transaccion[]> {
    const entities: TransaccionEntity[] = await this.repo
      .createQueryBuilder('t')
      .innerJoin('lotes', 'l', 'l.id = t.loteId')
      .where('l.clienteId = :clienteId', { clienteId })
      .getMany();
    return entities.map((e) => e.toDomain());
  }

  async findByFecha(fecha: Date): Promise<Transaccion[]> {
    const entities = await this.repo.find({ where: { createdAt: fecha } });
    return entities.map((e) => e.toDomain());
  }

  async findByOperationId(opId: number): Promise<Transaccion[]> {
    const where: FindOptionsWhere<TransaccionEntity> = {
      operationId: Number(opId),
    };
    const entities: TransaccionEntity[] = await this.repo.find({ where });
    return entities.map((e) => e.toDomain());
  }

  async findByReferencia(ref: string): Promise<Transaccion[]> {
    const where: FindOptionsWhere<TransaccionEntity> = { referenciaId: ref };
    const entities: TransaccionEntity[] = await this.repo.find({ where });
    return entities.map((e) => e.toDomain());
  }

  async save(
    transaccion: Transaccion,
    ctx?: TransactionContext,
  ): Promise<void> {
    const entity = TransaccionEntity.fromDomain(transaccion);
    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.save(TransaccionEntity, entity);
    } else {
      await this.repo.save(entity);
    }
  }

  async delete(id: TransaccionId, ctx?: TransactionContext): Promise<void> {
    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.delete(TransaccionEntity, { id: id.value });
    } else {
      await this.repo.delete({ id: id.value });
    }
  }
}
