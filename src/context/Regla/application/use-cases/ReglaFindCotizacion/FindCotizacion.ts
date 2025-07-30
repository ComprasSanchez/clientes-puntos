import { Inject, Injectable } from '@nestjs/common';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { ReglaNotFound } from '@regla/core/exceptions/ReglaNotFoundError';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { REGLA_REPO } from '@regla/core/tokens/tokens';

@Injectable()
export class ReglaFindCotizacion {
  constructor(
    @Inject(REGLA_REPO)
    private readonly reglaRepository: ReglaRepository,
  ) {}

  async run(): Promise<ConversionRule> {
    const regla = await this.reglaRepository.findCotizacion();
    if (!regla) {
      throw new ReglaNotFound();
    }
    return regla;
  }
}
