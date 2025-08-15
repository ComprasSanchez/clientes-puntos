// @regla/infrastructure/entities/producto-rule.entity.ts
import { ChildEntity, Column } from 'typeorm';
import { ReglaEntity } from './regla.entity';
import { TipoRegla } from '@regla/core/enums/TipoRegla';
import { ReglaId } from '@regla/core/value-objects/ReglaId';
import { ReglaNombre } from '@regla/core/value-objects/ReglaNombre';
import { ReglaPrioridad } from '@regla/core/value-objects/ReglaPrioridad';
import { ReglaFlag } from '@regla/core/value-objects/ReglaFlag';
import { ReglaVigenciaInicio } from '@regla/core/value-objects/ReglaVigenciaInicio';
import { ReglaVigenciaFin } from '@regla/core/value-objects/ReglaVigenciaFin';
import { ReglaDescripcion } from '@regla/core/value-objects/ReglaDescripcion';
import { ReglaProducto } from '@regla/core/entities/ProductoRule';
import { EfectoProducto } from '@regla/core/value-objects/EfectoProducto';
import { EfectoProductoTransformer } from '../transformers/EfectoProductoTransformer';

@ChildEntity('PRODUCTO')
export class ProductoRuleEntity extends ReglaEntity {
  @Column('jsonb', { transformer: EfectoProductoTransformer })
  config!: EfectoProducto;

  toDomain(): ReglaProducto {
    return new ReglaProducto(
      new ReglaId(this.id),
      new ReglaNombre(this.nombre),
      new ReglaPrioridad(this.prioridad),
      new ReglaFlag(this.activa),
      new ReglaFlag(this.excluyente),
      new ReglaVigenciaInicio(this.vigenciaInicio),
      this.vigenciaFin ? new ReglaVigenciaFin(this.vigenciaFin) : undefined,
      this.descripcion ? new ReglaDescripcion(this.descripcion) : undefined,
      this.config,
    );
  }

  static fromDomain(domain: ReglaProducto): ProductoRuleEntity {
    const e = new ProductoRuleEntity();
    e.id = domain.id.value;
    e.nombre = domain.nombre.value;
    e.tipo = TipoRegla.PRODUCTO;
    e.prioridad = domain.prioridad.value;
    e.activa = domain.activa.value;
    e.excluyente = domain.excluyente.value;
    e.vigenciaInicio = domain.vigenciaInicio.value;
    e.vigenciaFin = domain.vigenciaFin?.value;
    e.descripcion = domain.descripcion?.value;
    e.config = domain.efectoVO;
    return e;
  }
}
