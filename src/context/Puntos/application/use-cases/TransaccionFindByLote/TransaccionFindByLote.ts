// src/application/use-cases/transaccion/FindTransaccionesByLoteUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { TX_REPO } from '@puntos/core/tokens/tokens';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { LoteId } from '@puntos/core/value-objects/LoteId';

@Injectable()
export class FindTransaccionesByLoteUseCase {
  constructor(
    @Inject(TX_REPO)
    private readonly transaccionRepo: TransaccionRepository,
  ) {}

  async run(loteId: LoteId): Promise<Transaccion[]> {
    return this.transaccionRepo.findByLote(loteId);
  }
}
