import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperacionEntity } from '../../entities/operacion.entity';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { Operacion } from '@puntos/core/entities/Operacion';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { TypeOrmBaseRepository } from '@shared/infrastructure/transaction/TypeOrmBaseRepository';
import { FechaOperacion } from '@puntos/core/value-objects/FechaOperacion';

@Injectable()
export class TypeOrmOperacionRepository
  extends TypeOrmBaseRepository
  implements OperacionRepository
{
  constructor(
    @InjectRepository(OperacionEntity)
    private readonly ormRepo: Repository<OperacionEntity>,
  ) {
    super();
  }

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

  async findBetween(startUtc: Date, endUtc: Date): Promise<Operacion[]> {
    // Cambiá 'fecha' por 'fechaOperacion' si así se llama tu columna
    const rows = await this.ormRepo
      .createQueryBuilder('o')
      .where('o.fecha >= :start', { start: startUtc })
      .andWhere('o.fecha < :end', { end: endUtc })
      // .where('o.fechaOperacion >= :start', { start: startUtc })
      // .andWhere('o.fechaOperacion < :end',  { end: endUtc })
      .getMany();

    return rows.map((e) => e.toDomain());
  }

  async findByFecha(fecha: FechaOperacion): Promise<Operacion[]> {
    const entities = await this.ormRepo.find({
      where: { fecha: fecha.value },
    });
    return entities.map((e) => e.toDomain());
  }

  async save(operacion: Operacion, ctx?: TransactionContext): Promise<void> {
    const entity = OperacionEntity.fromDomain(operacion);
    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.save(OperacionEntity, entity);
    } else {
      await this.ormRepo.save(entity);
    }
  }

  async delete(id: OperacionId, ctx?: TransactionContext): Promise<void> {
    const manager = this.extractManager(ctx);
    if (manager) {
      await manager.delete(OperacionEntity, { id: id.value });
    } else {
      await this.ormRepo.delete({ id: id.value });
    }
  }
}
