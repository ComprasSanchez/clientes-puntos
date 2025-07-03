import { OpTipo } from '@shared/core/enums/OpTipo';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';

export class OperacionResponseDto {
  id: number;
  clienteId: string;
  tipo: OpTipo;
  fecha: Date;
  origenTipo: string;
  puntos?: number;
  monto?: number;
  moneda?: TipoMoneda;
  refOperacion?: string | null;
  refAnulacion?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
