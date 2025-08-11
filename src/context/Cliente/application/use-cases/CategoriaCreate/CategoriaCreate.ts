// @cliente/application/use-cases/CategoriaCreate.ts
import { CategoriaRepository } from '../../../core/repository/CategoriaRepository';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';
import { Categoria } from '@cliente/core/entities/Categoria';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIA_REPO } from '@cliente/core/tokens/tokens';

@Injectable()
export class CategoriaCreate {
  constructor(
    @Inject(CATEGORIA_REPO)
    private readonly repo: CategoriaRepository,
    @Inject(UUIDGenerator)
    private readonly idGen: UUIDGenerator,
  ) {}

  /**
   * Crea una nueva categoría de cliente.
   */
  async run(input: {
    nombre: string;
    descripcion?: string | null;
    default?: boolean;
  }): Promise<void> {
    const idVo = new CategoriaId(this.idGen.generate());
    const nombreVo = new CategoriaNombre(input.nombre);
    const descripcionVo =
      input.descripcion !== undefined
        ? new CategoriaDescripcion(input.descripcion)
        : undefined;
    const isDefault = input.default ?? false;

    const categoria = new Categoria(
      idVo,
      nombreVo,
      null,
      descripcionVo,
      isDefault,
    );
    await this.repo.create(categoria);
  }
}
