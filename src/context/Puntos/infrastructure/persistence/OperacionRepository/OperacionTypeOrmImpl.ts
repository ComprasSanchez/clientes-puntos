// src/infrastructure/persistence/OperacionRepository/TypeOrmOperacionRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperacionEntity } from '../../entities/operacion.entity';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { Operacion } from '@puntos/core/entities/Operacion';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';

@Injectable()
export class TypeOrmOperacionRepository implements OperacionRepository {
  constructor(
    @InjectRepository(OperacionEntity)
    private readonly ormRepo: Repository<OperacionEntity>,
  ) {}

  async findAll(): Promise<Operacion[]> {
    const entities = await this.ormRepo.find();
    return entities.map((e) => e.toDomain());
  }

  async findById(id: OperacionId): Promise<Operacion | null> {
    const entity = await this.ormRepo.findOne({ where: { id: id.value } });
    return entity ? entity.toDomain() : null;
  }

  async findByCliente(clienteId: string): Promise<Operacion[]> {
    const entities = await this.ormRepo.find({ where: { clienteId } });
    return entities.map((e) => e.toDomain());
  }

  async findByReferencia(referenciaId: string): Promise<Operacion[]> {
    const entities = await this.ormRepo.find({
      where: { refOperacion: referenciaId },
    });
    return entities.map((e) => e.toDomain());
  }

  async save(operacion: Operacion): Promise<void> {
    const entity = OperacionEntity.fromDomain(operacion);
    await this.ormRepo.save(entity);
  }

  async delete(id: OperacionId): Promise<void> {
    await this.ormRepo.delete({ id: id.value });
  }
}
