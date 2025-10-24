import { PlexConsultarEstadisticaClienteParsed } from '../interfaces/consultar-estadisticas-parsed.interface';

export interface PlexConsultarEstadisticaClienteRequestDto {
  codAccion: string; // Siempre "301"
  dni: string;
}

export class PlexConsultarEstadisticaClienteRequestMapper {
  static fromXml(obj: unknown): PlexConsultarEstadisticaClienteRequestDto {
    const { MensajeFidelyGB } = obj as PlexConsultarEstadisticaClienteParsed;
    return {
      codAccion: MensajeFidelyGB.CodAccion ?? '',
      dni: MensajeFidelyGB.DNI ?? '',
    };
  }
}
