/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CATEGORIA_REPO } from '@cliente/core/tokens/tokens';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CategoriaDelete {
  constructor(
    @Inject(CATEGORIA_REPO)
    private readonly repo: CategoriaRepository,
  ) {}

  /**
   * Elimina (o desactiva) una categoría.
   */
  async run(id: string): Promise<void> {
    const idVo = new CategoriaId(id);
    const categoria = await this.repo.findById(idVo);
    if (!categoria) throw new CategoriaNotFoundError(id);
    await this.repo.delete(idVo);
  }
}
