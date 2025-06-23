// src/context/cliente/application/use-cases/CategoriaCreate.ts

import { CategoriaRepository } from '../../../core/repository/CategoriaRepository';
import { Categoria } from '../../../core/entities/Categoria';
import { CategoriaId } from '../../../core/value-objects/CategoriaId';
import { CategoriaNombre } from '../../../core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '../../../core/value-objects/CategoriaDescripcion';
import { UUIDGenerator } from 'src/shared/core/uuid/UuidGenerator';

export class CategoriaCreate {
  constructor(
    private readonly repo: CategoriaRepository,
    private readonly idGen: UUIDGenerator,
  ) {}

  /**
   * Crea una nueva categoría de cliente.
   */
  async run(input: {
    nombre: string;
    descripcion?: string | null;
  }): Promise<void> {
    const idVo = new CategoriaId(this.idGen.generate());
    const nombreVo = new CategoriaNombre(input.nombre);
    const descripcionVo =
      input.descripcion !== undefined
        ? new CategoriaDescripcion(input.descripcion)
        : undefined;

    const categoria = new Categoria(idVo, nombreVo, descripcionVo);
    await this.repo.create(categoria);
  }
}
