import { ChildEntity, Column } from 'typeorm';
import { ReglaEntity } from './regla.entity';
import { TipoRegla } from '../../core/enums/TipoRegla';
import { ConversionRule } from '../../core/entities/ConversionRule';
import { ReglaId } from '../../core/value-objects/ReglaId';
import { ReglaNombre } from '../../core/value-objects/ReglaNombre';
import { ReglaPrioridadCotizacion } from '../../core/value-objects/ReglaPrioridadCotizacion';
import { ReglaFlag } from '../../core/value-objects/ReglaFlag';
import { ReglaVigenciaInicio } from '../../core/value-objects/ReglaVigenciaInicio';
import { ReglaVigenciaFin } from '../../core/value-objects/ReglaVigenciaFin';
import { ReglaDescripcion } from '../../core/value-objects/ReglaDescripcion';
import { ConversionConfigTransformer } from '../transformers/ConversionConfigTransformer';
import { ConversionConfig } from '../../core/value-objects/ConversionConfig';
import { DiasExpiracion } from '../../core/value-objects/DiasExpiracion';

/**
 * Entidad específica para reglas de tipo CONVERSION.
 * Hereda de ReglaEntity (STI).
 */
@ChildEntity('CONVERSION')
export class ConversionRuleEntity extends ReglaEntity {
  @Column('jsonb', {
    nullable: true,
    transformer: ConversionConfigTransformer,
  })
  config!: ConversionConfig;

  /**
   * Mapea la entidad a la regla de dominio.
   */
  toDomain(): ConversionRule {
    return new ConversionRule(
      new ReglaId(this.id),
      new ReglaNombre(this.nombre),
      new ReglaPrioridadCotizacion(this.prioridad),
      new ReglaFlag(this.activa),
      new ReglaFlag(this.excluyente),
      new ReglaVigenciaInicio(this.vigenciaInicio),
      this.vigenciaFin ? new ReglaVigenciaFin(this.vigenciaFin) : undefined,
      this.descripcion ? new ReglaDescripcion(this.descripcion) : undefined,
      this.config.rateAccred,
      this.config.rateSpend,
      this.config.creditExpiryDays
        ? new DiasExpiracion(this.config.creditExpiryDays.value)
        : undefined,
    );
  }

  static fromDomain(domain: ConversionRule): ConversionRuleEntity {
    const e = new ConversionRuleEntity();
    e.id = domain.id.value;
    e.nombre = domain.nombre.value;
    e.tipo = TipoRegla.CONVERSION;
    e.prioridad = domain.prioridad.value;
    e.activa = domain.activa.value;
    e.excluyente = domain.excluyente.value;
    e.vigenciaInicio = domain.vigenciaInicio.value;
    e.vigenciaFin = domain.vigenciaFin?.value;
    e.descripcion = domain.descripcion?.value;
    e.config = new ConversionConfig(
      domain.rateAccredVo,
      domain.rateSpendVo,
      domain.creditExpiryDaysVo,
    );

    return e;
  }
}
