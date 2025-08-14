import { TipoClasificador } from '../enums/TipoClasificador.enum';

export class ClasificadorAsociado {
  constructor(
    public readonly tipo: TipoClasificador,
    public readonly idClasificador: number,
    public readonly nombre: string,
  ) {}
}
