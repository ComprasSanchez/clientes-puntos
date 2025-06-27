import { ConversionRule } from '../../core/entities/ConversionRule';
import { Regla } from '../../core/entities/Regla';
import { TipoRegla } from '../../core/enums/TipoRegla';
import { DiasExpiracion } from '../../core/value-objects/DiasExpiracion';
import { RatioConversion } from '../../core/value-objects/RatioConversion';
import { ReglaDescripcion } from '../../core/value-objects/ReglaDescripcion';
import { ReglaFlag } from '../../core/value-objects/ReglaFlag';
import { ReglaId } from '../../core/value-objects/ReglaId';
import { ReglaNombre } from '../../core/value-objects/ReglaNombre';
import { ReglaPrioridad } from '../../core/value-objects/ReglaPrioridad';
import { ReglaTipo } from '../../core/value-objects/ReglaTipo';
import { ReglaVigenciaFin } from '../../core/value-objects/ReglaVigenciaFin';
import { ReglaVigenciaInicio } from '../../core/value-objects/ReglaVigenciaInicio';
import { RawRegla } from '../models/RawRegla';

export class ReglaFactory {
  static create(raw: RawRegla): Regla {
    // Mapea los VOs comunes a todas las reglas
    const id = new ReglaId(raw.id);
    const nombre = new ReglaNombre(raw.nombre);
    const prioridad = new ReglaPrioridad(raw.prioridad);
    const activa = new ReglaFlag(raw.activa);
    const excluyente = new ReglaFlag(raw.excluyente);
    const vigInicio = new ReglaVigenciaInicio(new Date(raw.vigenciaInicio));
    const vigFin = raw.vigenciaFin
      ? new ReglaVigenciaFin(new Date(raw.vigenciaFin))
      : undefined;
    const descripcion = raw.descripcion
      ? new ReglaDescripcion(raw.descripcion)
      : undefined;
    const tipo = ReglaTipo.create(raw.tipo);

    switch (tipo.value) {
      case TipoRegla.CONVERSION:
        return new ConversionRule(
          id,
          nombre,
          tipo,
          prioridad,
          activa,
          excluyente,
          vigInicio,
          vigFin,
          descripcion,
          new RatioConversion(raw.rateAccred!),
          new RatioConversion(raw.rateSpend!),
          new DiasExpiracion(raw.creditExpiryDays!),
        );
      // case 'otroTipo': …
      default:
        throw new Error(`Tipo de regla desconocido: ${tipo.value}`);
    }
  }
}
