/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CATEGORIA_REPO } from '@cliente/core/tokens/tokens';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CategoriaFindById {
  constructor(
    @Inject(CATEGORIA_REPO) private readonly repo: CategoriaRepository,
  ) {}

  /**
   * Devuelve la categoría por su ID o lanza si no existe.
   */
  async run(id: string): Promise<Categoria> {
    const idVo = new CategoriaId(id);
    const categoria = await this.repo.findById(idVo);
    if (!categoria) throw new CategoriaNotFoundError(id);
    return categoria;
  }
}
