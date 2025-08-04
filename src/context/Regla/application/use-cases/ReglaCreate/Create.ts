// @regla/application/use-cases/ReglaCreate.ts
import { Injectable, Inject } from '@nestjs/common';
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { TipoRegla } from '@regla/core/enums/TipoRegla';
import { ReglaId } from '@regla/core/value-objects/ReglaId';
import { ReglaNombre } from '@regla/core/value-objects/ReglaNombre';
import { ReglaPrioridadCotizacion } from '@regla/core/value-objects/ReglaPrioridadCotizacion';
import { ReglaFlag } from '@regla/core/value-objects/ReglaFlag';
import { ReglaVigenciaInicio } from '@regla/core/value-objects/ReglaVigenciaInicio';
import { ReglaVigenciaFin } from '@regla/core/value-objects/ReglaVigenciaFin';
import { ReglaDescripcion } from '@regla/core/value-objects/ReglaDescripcion';
import { ConversionConfig } from '@regla/core/value-objects/ConversionConfig';
import { CreateReglaDto } from '@regla/application/dtos/CreateReglaDto';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { Regla } from '@regla/core/entities/Regla';
import { RulesCacheLoader } from '@infrastructure/cache/rules-cache/rules-cache.loader';

@Injectable()
export class ReglaCreate {
  constructor(
    @Inject(ReglaRepository) private readonly repo: ReglaRepository,
    @Inject(UUIDGenerator) private readonly idGen: UUIDGenerator,
    @Inject(RulesCacheLoader)
    private readonly rulesCacheLoader: RulesCacheLoader,
  ) {}

  async run(dto: CreateReglaDto): Promise<void> {
    let regla: Regla;
    switch (dto.tipo) {
      case TipoRegla.CONVERSION: {
        const config = ConversionConfig.fromPlain(dto.config);
        regla = new ConversionRule(
          new ReglaId(this.idGen.generate()),
          new ReglaNombre(dto.nombre),
          new ReglaPrioridadCotizacion(dto.prioridad),
          new ReglaFlag(dto.activa),
          new ReglaFlag(dto.excluyente),
          new ReglaVigenciaInicio(new Date(dto.vigenciaInicio)),
          dto.vigenciaFin
            ? new ReglaVigenciaFin(new Date(dto.vigenciaFin))
            : undefined,
          dto.descripcion ? new ReglaDescripcion(dto.descripcion) : undefined,
          config.rateAccred,
          config.rateSpend,
          config.creditExpiryDays,
        );
        break;
      }
      default:
        throw new Error(`Tipo de regla no soportado: ${dto.tipo}`);
    }
    await this.repo.save(regla);

    await this.rulesCacheLoader.invalidate();
  }
}
