import { PlexConsultarClienteParsed } from '../interfaces/consultar-cliente-parsed.interface';

export interface PlexConsultarClienteRequestDto {
  codAccion: string; // Siempre "300"
  nroTarjeta: string;
}

export class PlexConsultarClienteRequestMapper {
  static fromXml(obj: unknown): PlexConsultarClienteRequestDto {
    const { MensajeFidelyGb } = obj as PlexConsultarClienteParsed;
    return {
      codAccion: MensajeFidelyGb.CodAccion ?? '',
      nroTarjeta: MensajeFidelyGb.NroTarjeta ?? '',
    };
  }
}
