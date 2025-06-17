import { CategoriaRepository } from '../../../core/repository/CategoriaRepository';
import { Categoria } from '../../../core/entities/Categoria';

export class CategoriaFindAll {
  constructor(private readonly repo: CategoriaRepository) {}

  /**
   * Lista todas las categorías.
   */
  async run(): Promise<Categoria[]> {
    return this.repo.findAll();
  }
}
