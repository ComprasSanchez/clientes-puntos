// src/application/use-cases/operacion/FindAllOperacionesUseCase.ts
import { Injectable, Inject } from '@nestjs/common';
import { OPERACION_REPO } from '@puntos/core/tokens/tokens';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { Operacion } from '@puntos/core/entities/Operacion';

@Injectable()
export class FindAllOperacionesUseCase {
  constructor(
    @Inject(OPERACION_REPO)
    private readonly operacionRepo: OperacionRepository,
  ) {}

  async run(): Promise<Operacion[]> {
    return this.operacionRepo.findAll();
  }
}
