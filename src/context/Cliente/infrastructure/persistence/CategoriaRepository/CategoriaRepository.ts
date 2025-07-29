import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaEntity } from '../../entities/CategoriaEntity';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';

@Injectable()
export class TypeOrmCategoriaRepository implements CategoriaRepository {
  constructor(
    @InjectRepository(CategoriaEntity)
    private readonly repository: Repository<CategoriaEntity>,
  ) {}

  /** Lista todas las categorías existentes. */
  async findAll(): Promise<Categoria[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  /** Busca una categoría por su ID. */
  async findById(id: CategoriaId): Promise<Categoria | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findDefault(): Promise<Categoria | undefined> {
    const entity = await this.repository.findOne({
      where: { isDefault: true },
    });
    if (!entity) return undefined;
    return this.toDomain(entity);
  }

  /** Crea una nueva categoría. */
  async create(categoria: Categoria): Promise<void> {
    const entity = this.toEntity(categoria);
    await this.repository.save(entity);
  }

  /** Actualiza una categoría existente. */
  async update(categoria: Categoria): Promise<void> {
    const entity = this.toEntity(categoria);
    await this.repository.save(entity);
  }

  /** Elimina (o desactiva) una categoría por su ID. */
  async delete(id: CategoriaId): Promise<void> {
    await this.repository.delete(id.value);
  }

  private toDomain(entity: CategoriaEntity): Categoria {
    return new Categoria(
      new CategoriaId(entity.id),
      new CategoriaNombre(entity.nombre),
      new CategoriaDescripcion(entity.descripcion),
    );
  }

  private toEntity(categoria: Categoria): CategoriaEntity {
    const entity = new CategoriaEntity();
    entity.id = categoria.id.value;
    entity.nombre = categoria.nombre.value;
    entity.descripcion = categoria.descripcion.value ?? undefined;
    return entity;
  }
}
