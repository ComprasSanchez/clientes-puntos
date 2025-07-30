import { PlexFidelizarVentaFXPParsed } from '../interfaces/fidelizar-venta-parsed.interface';

type ProductoParsed = {
  IdProducto?: string;
  Cantidad?: string | number;
  Precio?: string | number;
  IdComprobanteRef?: string;
};

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
    const { MensajeFidelyGb } = obj as PlexFidelizarVentaFXPParsed;
    const venta = MensajeFidelyGb?.Venta || {};

    let productosArr: ProductoParsed[] = [];
    if (Array.isArray(venta.Productos)) {
      productosArr = venta.Productos;
    } else if (venta.Productos) {
      productosArr = [venta.Productos];
    }

    const safeNumber = (val: any, def = 0) => {
      const n = Number(val);
      return isNaN(n) ? def : n;
    };

    return {
      codAccion: MensajeFidelyGb?.CodAccion
        ? String(MensajeFidelyGb.CodAccion).trim()
        : '',
      idMovimiento: venta.IdMovimiento
        ? String(venta.IdMovimiento).trim()
        : undefined,
      nroTarjeta: venta.NroTarjeta ? String(venta.NroTarjeta).trim() : '',
      importeTotal: safeNumber(venta.ImporteTotal),
      valorCanjePunto: safeNumber(venta.ValorCanjePunto),
      puntosCanjeados: safeNumber(venta.PuntosCanjeados),
      idComprobante: venta.IdComprobante
        ? String(venta.IdComprobante).trim()
        : '',
      nroComprobante: venta.NroComprobante
        ? String(venta.NroComprobante).trim()
        : '',
      fechaComprobante: venta.FechaComprobante
        ? String(venta.FechaComprobante).trim()
        : '',
      productos: productosArr.map((p) => ({
        idProducto: p.IdProducto ? String(p.IdProducto).trim() : '',
        cantidad: safeNumber(p.Cantidad),
        precio: safeNumber(p.Precio),
        idComprobanteRef: p.IdComprobanteRef
          ? String(p.IdComprobanteRef).trim()
          : '',
      })),
    };
  }
}
