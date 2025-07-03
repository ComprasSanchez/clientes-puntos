import { Injectable, Inject } from '@nestjs/common';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';

@Injectable()
export class ReglaDelete {
  constructor(
    @Inject(ReglaRepository) private readonly repo: ReglaRepository,
  ) {}

  async run(id: string): Promise<void> {
    const regla = await this.repo.findById(id);
    if (!regla) {
      throw new Error('Regla no encontrada');
    }
    await this.repo.delete(id);
  }
}
