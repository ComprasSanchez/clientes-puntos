/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/context/cliente/application/use-cases/CategoriaCreate.ts
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';
import { Categoria } from '@cliente/core/entities/Categoria';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';

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
