// src/application/use-cases/transaccion/FindTransaccionByIdUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { TX_REPO } from '@puntos/core/tokens/tokens';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';

@Injectable()
export class FindTransaccionByIdUseCase {
  constructor(
    @Inject(TX_REPO)
    private readonly transaccionRepo: TransaccionRepository,
  ) {}

  async run(id: TransaccionId): Promise<Transaccion | null> {
    return this.transaccionRepo.findById(id);
  }
}
