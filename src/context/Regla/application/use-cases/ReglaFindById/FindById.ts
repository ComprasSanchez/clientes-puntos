// @regla/application/use-cases/ReglaFindById.ts
import { Injectable, Inject } from '@nestjs/common';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { Regla } from '@regla/core/entities/Regla';

@Injectable()
export class ReglaFindById {
  constructor(
    @Inject(ReglaRepository) private readonly repo: ReglaRepository,
  ) {}

  async run(id: string): Promise<Regla> {
    const regla = await this.repo.findById(id);
    if (!regla) throw new Error('Regla no encontrada');
    return regla;
  }
}
