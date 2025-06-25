import { OrigenOperacion } from '../../core/value-objects/OrigenOperacion';

export interface OperacionDto {
  clienteId: string;
  origenTipo: OrigenOperacion;
  puntos?: number;
  montoMoneda?: number;
  moneda?: string;
  referencia?: string;
}
