export interface OperacionDto {
  clienteId: string;
  origenTipo: string;
  puntos?: number;
  montoMoneda?: number;
  moneda?: string;
  referencia?: string;
  refOperacion?: number;
  idComprobante?: number | null;
  idComprobanteRef?: number | null;
  codSucursal?: string;
  productos?: Array<{
    codExt: number;
    cantidad: number;
    precio: number;
  }>;
}