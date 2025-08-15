export interface OperacionDto {
  clienteId: string;
  origenTipo: string;
  puntos?: number;
  montoMoneda?: number;
  moneda?: string;
  referencia?: string;
  refOperacion?: number;
  codSucursal?: string;
  productos?: Array<{
    codExt: number;
    cantidad: number;
    precio: number; // importe unitario (misma moneda que `moneda`)
  }>;
}
