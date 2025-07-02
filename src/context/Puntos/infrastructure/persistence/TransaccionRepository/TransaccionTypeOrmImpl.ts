import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TransaccionEntity } from '../../entities/transaccion.entity';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';
import { LoteId } from '@puntos/core/value-objects/LoteId';

@Injectable()
export class TypeOrmTransaccionRepository implements TransaccionRepository {
  constructor(
    @InjectRepository(TransaccionEntity)
    private readonly repo: Repository<TransaccionEntity>,
  ) {}

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
    // Assuming a query across relations or via lote join; simple example:
    const entities: TransaccionEntity[] = await this.repo
      .createQueryBuilder('t')
      .innerJoin('lotes', 'l', 'l.id = t.loteId')
      .where('l.clienteId = :clienteId', { clienteId })
      .getMany();
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

  async save(transaccion: Transaccion): Promise<void> {
    await this.repo.save(TransaccionEntity.fromDomain(transaccion));
  }

  async delete(id: TransaccionId): Promise<void> {
    await this.repo.delete({ id: id.value });
  }
}
