/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PlexFidelizarProductoRequestDto } from '../interfaces/fidelizar-producto.request';

export class PlexFidelizarProductoRequestMapper {
  // Ajustá los paths según tu XML real
  static fromXml(parsed: unknown): PlexFidelizarProductoRequestDto {
    const root = parsed as any;
    const m = root?.MensajeFidelyGb ?? root?.MensajeFidelyGB ?? root ?? {};

    const parseBool = (v: any) =>
      typeof v === 'boolean'
        ? v
        : String(v ?? '').trim() === '1' ||
          String(v ?? '').toLowerCase() === 'true';

    const clasificadoresRaw = m?.Producto?.Clasificadores?.Clasificador ?? [];
    const clasificadores = Array.isArray(clasificadoresRaw)
      ? clasificadoresRaw
      : [clasificadoresRaw].filter(Boolean);

    return {
      codAccion: String(m?.CodAccion ?? m?.codAccion ?? 0),
      idProducto: Number(m?.Producto?.IdProducto ?? m?.IdProducto),
      producto: m?.Producto?.Nombre ?? m?.Nombre,
      presentacion: m?.Producto?.Presentacion ?? m?.Presentacion,
      costo:
        m?.Producto?.Costo != null ? Number(m?.Producto?.Costo) : undefined,
      precio:
        m?.Producto?.Precio != null ? Number(m?.Producto?.Precio) : undefined,
      activa:
        m?.Producto?.Activa != null
          ? parseBool(m?.Producto?.Activa)
          : undefined,
      motivo: m?.Motivo,
      clasificadores: clasificadores.map((c: any) => ({
        idTipoClasificador: Number(c?.IdTipoClasificador),
        idClasificador: Number(c?.IdClasificador),
        nombre: c?.Nombre,
      })),
    };
  }
}
