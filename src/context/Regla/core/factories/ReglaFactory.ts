import { ReglaDTO } from '../dto/ReglaDTO';
import { ConversionRule } from '../entities/ConversionRule';
import { Regla } from '../entities/Regla';
import { TipoRegla } from '../enums/TipoRegla';

export class ReglaFactory {
  static fromJSON(json: ReglaDTO): Regla {
    const tipo = json.tipo.value;
    switch (tipo) {
      case TipoRegla.CONVERSION:
        return ConversionRule.fromJSON(json);
      // case 'OTRO_TIPO':
      //   return OtroTipoDeRegla.fromJSON(json);
      default:
        throw new Error(`Tipo de regla no soportado`);
    }
  }
}
