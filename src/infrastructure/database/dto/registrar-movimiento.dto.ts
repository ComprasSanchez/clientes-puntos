export interface RegistrarMovimientoDto {
  tipoIntegracion: string;
  txTipo: string;
  requestPayload: Record<string, any>;
  status: string;
  responsePayload?: unknown;
  mensajeError?: string;
  referenciaExterna?: string;
  idMovimiento?: string;
}
