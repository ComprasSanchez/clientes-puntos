import { PlexFidelizarVentaFXPParsed } from '../interfaces/fidelizar-venta-parsed.interface';

type ProductoParsed = {
  IdProducto?: number;
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
    idProducto: number;
    cantidad: number;
    precio: number;
    idComprobanteRef?: string;
  }>;

  static fromXml(obj: unknown): PlexFidelizarVentaRequestDto {
    const { MensajeFidelyGB } = obj as PlexFidelizarVentaFXPParsed;
    const venta = MensajeFidelyGB?.Venta || {};

    let productosArr: ProductoParsed[] = [];
    if (Array.isArray(venta.Productos)) {
      productosArr = venta.Productos;
    } else if (venta.Productos) {
      productosArr = [venta.Productos];
    }

    /**
     * Convierte valores tipo "1.234,56" o "30,00" a número JS (1234.56 o 30)
     */
    const parseMoneda = (val: any, def = 0): number => {
      if (val == null) return def;
      if (typeof val === 'number' && Number.isFinite(val)) return val;

      if (typeof val === 'string') {
        // Limpiar espacios
        let s = val.trim();
        if (!s) return def;

        // Eliminar separador de miles "." si hay coma decimal
        if (s.includes(',') && s.includes('.')) {
          s = s.replace(/\./g, '');
        }

        // Reemplazar coma por punto decimal
        s = s.replace(',', '.');

        const n = Number(s);
        return Number.isFinite(n) ? n : def;
      }

      return def;
    };

    return {
      codAccion: MensajeFidelyGB?.CodAccion
        ? String(MensajeFidelyGB.CodAccion).trim()
        : '',
      idMovimiento: venta.IdMovimiento
        ? String(venta.IdMovimiento).trim()
        : undefined,
      nroTarjeta: venta.NroTarjeta ? String(venta.NroTarjeta).trim() : '',
      importeTotal: parseMoneda(venta.ImporteTotal),
      valorCanjePunto: parseMoneda(venta.ValorCanjePunto),
      puntosCanjeados: parseMoneda(venta.PuntosCanjeados),
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
        idProducto: p.IdProducto!,
        cantidad: parseMoneda(p.Cantidad),
        precio: parseMoneda(p.Precio),
        idComprobanteRef: p.IdComprobanteRef
          ? String(p.IdComprobanteRef).trim()
          : '',
      })),
    };
  }
}
