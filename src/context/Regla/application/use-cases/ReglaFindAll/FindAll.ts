// @regla/application/use-cases/ReglaFindAll.ts
import { Injectable, Inject } from '@nestjs/common';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { Regla } from '@regla/core/entities/Regla';

@Injectable()
export class ReglaFindAll {
  constructor(
    @Inject(ReglaRepository) private readonly repo: ReglaRepository,
  ) {}

  async run(): Promise<Regla[]> {
    return await this.repo.findAll();
  }
}
