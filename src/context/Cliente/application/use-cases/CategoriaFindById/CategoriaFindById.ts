import { CategoriaRepository } from '../../../core/repository/CategoriaRepository';
import { Categoria } from '../../../core/entities/Categoria';
import { CategoriaId } from '../../../core/value-objects/CategoriaId';
import { CategoriaNotFoundError } from '../../../core/exceptions/CategoriaNotFoundError';

export class CategoriaFindById {
  constructor(private readonly repo: CategoriaRepository) {}

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
