/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';

export class CategoriaDelete {
  constructor(private readonly repo: CategoriaRepository) {}

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
