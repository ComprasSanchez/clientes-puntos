import { CategoriaRepository } from '../../../core/repository/CategoriaRepository';
import { CategoriaId } from '../../../core/value-objects/CategoriaId';
import { CategoriaNotFoundError } from '../../../core/exceptions/CategoriaNotFoundError';

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
