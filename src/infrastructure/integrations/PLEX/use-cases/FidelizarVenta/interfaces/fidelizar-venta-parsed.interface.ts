// utils/plex-fidelizar-venta-fxp.interface.ts

export interface PlexFidelizarVentaFXPParsed {
  MensajeFidelyGb: {
    CodAccion?: string;
    Venta?: {
      IdMovimiento?: string;
      NroTarjeta?: string;
      ImporteTotal?: string | number;
      ValorCanjePunto?: string | number;
      PuntosCanjeados?: string | number;
      IdComprobante?: string;
      NroComprobante?: string;
      FechaComprobante?: string;
      Productos?:
        | Array<{
            IdProducto?: number;
            Cantidad?: string | number;
            Precio?: string | number;
            IdComprobanteRef?: string;
          }>
        | {
            IdProducto?: number;
            Cantidad?: string | number;
            Precio?: string | number;
            IdComprobanteRef?: string;
          };
    };
  };
}
