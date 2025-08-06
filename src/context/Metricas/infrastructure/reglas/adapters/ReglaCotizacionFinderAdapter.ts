// /metricas/infrastructure/rules/RuleCotizacionFinderAdapter.ts
import { Inject, Injectable } from '@nestjs/common';
import { ReglaFindCotizacion } from '@regla/application/use-cases/ReglaFindCotizacion/FindCotizacion';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { RuleCotizacionFinder } from 'src/context/Metricas/core/reglas/interfaces/ReglaCotizacionFinder';

@Injectable()
export class RuleCotizacionFinderAdapter implements RuleCotizacionFinder {
  constructor(
    @Inject(ReglaFindCotizacion)
    private readonly reglaFindCotizacion: ReglaFindCotizacion,
  ) {}

  async findCotizacion(): Promise<ConversionRule> {
    return this.reglaFindCotizacion.run();
  }
}
