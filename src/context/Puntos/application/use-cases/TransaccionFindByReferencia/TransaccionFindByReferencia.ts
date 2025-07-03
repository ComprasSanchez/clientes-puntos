// src/application/use-cases/transaccion/FindTransaccionesByReferenciaUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { TX_REPO } from '@puntos/core/tokens/tokens';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Transaccion } from '@puntos/core/entities/Transaccion';

@Injectable()
export class FindTransaccionesByReferenciaUseCase {
  constructor(
    @Inject(TX_REPO)
    private readonly transaccionRepo: TransaccionRepository,
  ) {}

  async run(ref: string): Promise<Transaccion[]> {
    return this.transaccionRepo.findByReferencia(ref);
  }
}
