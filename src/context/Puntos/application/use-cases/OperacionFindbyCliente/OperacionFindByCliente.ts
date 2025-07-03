// src/application/use-cases/operacion/FindOperacionesByClienteUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { OPERACION_REPO } from '@puntos/core/tokens/tokens';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { Operacion } from '@puntos/core/entities/Operacion';

@Injectable()
export class FindOperacionesByClienteUseCase {
  constructor(
    @Inject(OPERACION_REPO)
    private readonly operacionRepo: OperacionRepository,
  ) {}

  async run(clienteId: string): Promise<Operacion[]> {
    return this.operacionRepo.findByCliente(clienteId);
  }
}
