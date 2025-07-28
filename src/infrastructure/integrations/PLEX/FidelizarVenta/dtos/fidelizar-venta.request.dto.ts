// plex-fidelizar-venta.request.dto.ts

import { PlexFidelizarVentaParsed } from '../interfaces/fidelizar-venta-parsed.interface';

export class PlexFidelizarVentaRequestDto {
  codAccion: string; // 200 = Venta, 201 = Devolución, 202 = Anular
  idMovimiento?: string;
  nroTarjeta: string;
  importeTotal: number;
  valorCanjePunto: number;
  puntosCanjeados: number;
  idComprobante: string;
  nroComprobante: string;
  fechaComprobante: string;
  productos: Array<{
    idProducto: string;
    cantidad: number;
    precio: number;
    idComprobanteRef?: string;
  }>;

  static fromXml(obj: unknown): PlexFidelizarVentaRequestDto {
    // Asegurate de que obj es del tipo esperado:
    const { MensajeFidelyGb } = obj as PlexFidelizarVentaParsed;
    const venta = MensajeFidelyGb.Venta;

    // normalizá productos a array
    const productosArr = Array.isArray(venta.Productos)
      ? venta.Productos
      : [venta.Productos];

    return {
      codAccion: MensajeFidelyGb.CodAccion?._text ?? '',
      idMovimiento: venta.idMovimiento?._text,
      nroTarjeta: venta.NroTarjeta?._text ?? '',
      importeTotal: parseFloat(venta.ImporteTotal?._text ?? '0'),
      valorCanjePunto: parseFloat(venta.ValorCanjePunto?._text ?? '0'),
      puntosCanjeados: parseInt(venta.PuntosCanjeados?._text ?? '0'),
      idComprobante: venta.IdComprobante?._text ?? '',
      nroComprobante: venta.NroComprobante?._text ?? '',
      fechaComprobante: venta.FechaComprobante?._text ?? '',
      productos: productosArr.map((p) => ({
        idProducto: p.IdProducto?._text ?? '',
        cantidad: parseInt(p.Cantidad?._text ?? '0'),
        precio: parseFloat(p.Precio?._text ?? '0'),
        idComprobanteRef: p.IdComprobanteRef?._text ?? '',
      })),
    };
  }
}
