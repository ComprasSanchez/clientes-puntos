import { PlexConsultarNovedadesClienteParsed } from '../interfaces/consultar-novedades-cliente-parsed.interface';

export interface PlexConsultarNovedadesClienteRequestDto {
  proveedor: string;
  codAccion: string;
  fechaDesde: string;
  fechaHasta: string;
}

export class PlexConsultarNovedadesClienteRequestMapper {
  static fromXml(obj: unknown): PlexConsultarNovedadesClienteRequestDto {
    const parsed = obj as PlexConsultarNovedadesClienteParsed;
    const root = parsed.MensajeFidelyGB ?? parsed.MensajeFidelyGb;

    return {
      proveedor: root?.Proveedor ?? '',
      codAccion: root?.CodAccion ?? '',
      fechaDesde: root?.FechaDesde ?? '',
      fechaHasta: root?.FechaHasta ?? '',
    };
  }
}
