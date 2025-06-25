// src/application/services/CreateTransaccionService.ts
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';
import { CreateTransaccionDto } from '../dtos/CreateTransaccionDto';
import { TransaccionFactory } from '../../core/factories/TransaccionFactory';

export class CreateTransaccionService {
  constructor(
    private readonly factory: TransaccionFactory,
    private readonly txRepo: TransaccionRepository,
  ) {}

  /**
   * Orquesta la creación y persistencia de una Transaccion
   */
  async run(params: CreateTransaccionDto): Promise<void> {
    const tx = this.factory.createFromDto(params);
    await this.txRepo.save(tx);
  }
}
