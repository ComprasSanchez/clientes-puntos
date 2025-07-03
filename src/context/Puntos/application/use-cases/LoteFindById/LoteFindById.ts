// src/application/use-cases/lote/FindLoteByIdUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { LOTE_REPO } from '@puntos/core/tokens/tokens';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { Lote } from '@puntos/core/entities/Lote';
import { LoteId } from '@puntos/core/value-objects/LoteId';

@Injectable()
export class FindLoteByIdUseCase {
  constructor(
    @Inject(LOTE_REPO)
    private readonly loteRepo: LoteRepository,
  ) {}

  async run(id: LoteId): Promise<Lote | null> {
    return this.loteRepo.findById(id);
  }
}
