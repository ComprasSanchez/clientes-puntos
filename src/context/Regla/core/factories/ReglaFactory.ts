import { ConversionRuleDTO } from '../dto/ConversionRuleDTO';
import { ProductoRuleDTO } from '../dto/ProductoRuleDTO';
import { ReglaDTO } from '../dto/ReglaDTO';
import { ConversionRule } from '../entities/ConversionRule';
import { ReglaProducto } from '../entities/ProductoRule';
import { Regla } from '../entities/Regla';
import { TipoRegla } from '../enums/TipoRegla';

export class ReglaFactory {
  static fromJSON(json: ReglaDTO): Regla {
    const tipo = json.tipo.value;
    switch (tipo) {
      case TipoRegla.CONVERSION:
        return ConversionRule.fromJSON(json as ConversionRuleDTO);
      case TipoRegla.PRODUCTO:
        return ReglaProducto.fromJSON(json as ProductoRuleDTO);
      default:
        throw new Error(`Tipo de regla no soportado`);
    }
  }
}
