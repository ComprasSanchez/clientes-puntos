// utils/plex-fidelizar-venta-parsed.interface.ts

export interface PlexFidelizarVentaParsed {
  MensajeFidelyGb: {
    CodAccion?: { _text: string };
    Venta: {
      idMovimiento?: { _text: string };
      NroTarjeta?: { _text: string };
      ImporteTotal?: { _text: string };
      ValorCanjePunto?: { _text: string };
      PuntosCanjeados?: { _text: string };
      IdComprobante?: { _text: string };
      NroComprobante?: { _text: string };
      FechaComprobante?: { _text: string };
      Productos:
        | Array<{
            IdProducto?: { _text: string };
            Cantidad?: { _text: string };
            Precio?: { _text: string };
            IdComprobanteRef?: { _text: string };
          }>
        | {
            IdProducto?: { _text: string };
            Cantidad?: { _text: string };
            Precio?: { _text: string };
            IdComprobanteRef?: { _text: string };
          };
    };
  };
}
