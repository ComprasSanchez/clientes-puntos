/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CATEGORIA_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CategoriaFindAll {
  constructor(
    @Inject(CATEGORIA_REPO)
    private readonly repo: CategoriaRepository,
  ) {}

  /**
   * Lista todas las categorías.
   */
  async run(): Promise<Categoria[]> {
    return this.repo.findAll();
  }
}
