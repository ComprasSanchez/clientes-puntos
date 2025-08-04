import { Injectable, Inject } from '@nestjs/common';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { TipoRegla } from '@regla/core/enums/TipoRegla';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { ReglaNombre } from '@regla/core/value-objects/ReglaNombre';
import { ReglaDescripcion } from '@regla/core/value-objects/ReglaDescripcion';
import { ReglaPrioridadCotizacion } from '@regla/core/value-objects/ReglaPrioridadCotizacion';
import { ReglaFlag } from '@regla/core/value-objects/ReglaFlag';
import { ReglaVigenciaInicio } from '@regla/core/value-objects/ReglaVigenciaInicio';
import { ReglaVigenciaFin } from '@regla/core/value-objects/ReglaVigenciaFin';
import { RatioConversion } from '@regla/core/value-objects/RatioConversion';
import { DiasExpiracion } from '@regla/core/value-objects/DiasExpiracion';
import { UpdateReglaDto } from '@regla/application/dtos/UpdateReglaDto';
import { RulesCacheLoader } from '@infrastructure/cache/rules-cache/rules-cache.loader';

@Injectable()
export class ReglaUpdate {
  constructor(
    @Inject(ReglaRepository)
    private readonly repo: ReglaRepository,
    @Inject(RulesCacheLoader)
    private readonly rulesCacheLoader: RulesCacheLoader,
  ) {}

  async run(id: string, dto: UpdateReglaDto): Promise<void> {
    const regla = await this.repo.findById(id);
    if (!regla) throw new Error('Regla no encontrada');

    // Setters base para cualquier tipo de regla
    if (dto.nombre) regla.cambiarNombre(new ReglaNombre(dto.nombre));
    if (dto.descripcion)
      regla.cambiarDescripcion(new ReglaDescripcion(dto.descripcion));
    if (dto.prioridad !== undefined)
      regla.cambiarPrioridad(new ReglaPrioridadCotizacion(dto.prioridad));
    if (dto.activa !== undefined)
      regla.cambiarActiva(new ReglaFlag(dto.activa));
    if (dto.excluyente !== undefined)
      regla.cambiarExcluyente(new ReglaFlag(dto.excluyente));
    if (dto.vigenciaInicio)
      regla.cambiarVigenciaInicio(
        new ReglaVigenciaInicio(new Date(dto.vigenciaInicio)),
      );
    if (dto.vigenciaFin !== undefined)
      regla.cambiarVigenciaFin(
        dto.vigenciaFin
          ? new ReglaVigenciaFin(new Date(dto.vigenciaFin))
          : undefined,
      );

    // Setters específicos de ConversionRule
    if (
      dto.config &&
      regla.tipo.value === TipoRegla.CONVERSION &&
      regla instanceof ConversionRule
    ) {
      if (dto.config.rateAccred !== undefined) {
        regla.cambiarRateAccred(new RatioConversion(dto.config.rateAccred));
      }
      if (dto.config.rateSpend !== undefined) {
        regla.cambiarRateSpend(new RatioConversion(dto.config.rateSpend));
      }
      if (dto.config.creditExpiryDays !== undefined) {
        regla.cambiarCreditExpiryDays(
          dto.config.creditExpiryDays !== undefined
            ? new DiasExpiracion(dto.config.creditExpiryDays)
            : undefined,
        );
      }
    }

    await this.repo.update(regla);

    // 👉 Invalidar el cache después de guardar
    await this.rulesCacheLoader.invalidate();
  }
}
