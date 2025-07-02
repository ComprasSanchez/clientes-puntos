/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';

export class CategoriaFindAll {
  constructor(private readonly repo: CategoriaRepository) {}

  /**
   * Lista todas las categorías.
   */
  async run(): Promise<Categoria[]> {
    return this.repo.findAll();
  }
}
