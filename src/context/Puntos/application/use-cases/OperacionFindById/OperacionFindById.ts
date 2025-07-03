// src/application/use-cases/operacion/FindOperacionByIdUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { OPERACION_REPO } from '@puntos/core/tokens/tokens';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { Operacion } from '@puntos/core/entities/Operacion';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';

@Injectable()
export class FindOperacionByIdUseCase {
  constructor(
    @Inject(OPERACION_REPO)
    private readonly operacionRepo: OperacionRepository,
  ) {}

  async run(id: OperacionId): Promise<Operacion | null> {
    return this.operacionRepo.findById(id);
  }
}
