// src/context/Sucursal/infrastructure/persistence/typeorm/SucursalTypeOrmRepository.ts
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SucursalEntity } from '../entites/SucursalEntity';
import { SucursalRepository } from 'src/context/Sucursal/core/repositories/SucurusalRepository';
import { Sucursal } from 'src/context/Sucursal/core/entities/Sucursal';

@Injectable()
export class SucursalTypeOrmRepository implements SucursalRepository {
  constructor(
    @InjectRepository(SucursalEntity)
    private readonly repo: Repository<SucursalEntity>,
  ) {}

  async save(sucursal: Sucursal): Promise<void> {
    const orm = SucursalEntity.fromDomain(sucursal);
    await this.repo.save(orm); // upsert por PK
  }

  async findById(id: string): Promise<Sucursal | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? SucursalEntity.toDomain(orm) : null;
  }

  async findByCodigo(codigo: string): Promise<Sucursal | null> {
    const orm = await this.repo.findOne({ where: { codigo } });
    return orm ? SucursalEntity.toDomain(orm) : null;
  }

  async existsCodigo(codigo: string): Promise<boolean> {
    const count = await this.repo.count({ where: { codigo } });
    return count > 0;
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
