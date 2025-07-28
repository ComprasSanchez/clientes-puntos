import { PlexConsultarEstadisticaClienteParsed } from '../interfaces/consultar-estadisticas-parsed.interface';

export interface PlexConsultarEstadisticaClienteRequestDto {
  codAccion: string; // Siempre "301"
  dni: string;
}

export class PlexConsultarEstadisticaClienteRequestMapper {
  static fromXml(obj: unknown): PlexConsultarEstadisticaClienteRequestDto {
    const { MensajeFidelyGb } = obj as PlexConsultarEstadisticaClienteParsed;
    return {
      codAccion: MensajeFidelyGb.CodAccion?._text ?? '',
      dni: MensajeFidelyGb.DNI?._text ?? '',
    };
  }
}
