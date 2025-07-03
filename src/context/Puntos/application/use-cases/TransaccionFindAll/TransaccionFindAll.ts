// src/application/use-cases/transaccion/FindAllTransaccionesUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { TX_REPO } from '@puntos/core/tokens/tokens';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Transaccion } from '@puntos/core/entities/Transaccion';

@Injectable()
export class FindAllTransaccionesUseCase {
  constructor(
    @Inject(TX_REPO)
    private readonly transaccionRepo: TransaccionRepository,
  ) {}

  async run(): Promise<Transaccion[]> {
    return this.transaccionRepo.findAll();
  }
}
