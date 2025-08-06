import { OpTipo } from '@shared/core/enums/OpTipo';

export interface OperacionPrimitives {
  _id: number;
  _clienteId: string;
  _tipo: OpTipo;
  _fecha?: string; // ISO date string
  _origenTipo: string;
  _puntos?: number;
  _monto?: number;
  _moneda?: string;
  _refOperacion?: string | null;
  _refAnulacion?: number | null;
}
