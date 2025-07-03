// src/application/use-cases/lote/FindLotesByClienteUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { LOTE_REPO } from '@puntos/core/tokens/tokens';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { Lote } from '@puntos/core/entities/Lote';
import { BatchEstado } from '@puntos/core/enums/BatchEstado';

@Injectable()
export class FindLotesByClienteUseCase {
  constructor(
    @Inject(LOTE_REPO)
    private readonly loteRepo: LoteRepository,
  ) {}

  async run(clienteId: string, estado?: BatchEstado): Promise<Lote[]> {
    return this.loteRepo.findByCliente(clienteId, estado);
  }
}
