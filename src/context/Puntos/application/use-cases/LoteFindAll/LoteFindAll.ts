// src/application/use-cases/lote/FindAllLotesUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { LOTE_REPO } from '@puntos/core/tokens/tokens';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { Lote } from '@puntos/core/entities/Lote';

@Injectable()
export class FindAllLotesUseCase {
  constructor(
    @Inject(LOTE_REPO)
    private readonly loteRepo: LoteRepository,
  ) {}

  async run(): Promise<Lote[]> {
    return this.loteRepo.findAll();
  }
}
