export interface OperacionDto {
  clienteId: string;
  origenTipo: string;
  puntos?: number;
  montoMoneda?: number;
  moneda?: string;
  referencia?: string;
  refOperacion?: number;
  codSucursal?: string;
}
