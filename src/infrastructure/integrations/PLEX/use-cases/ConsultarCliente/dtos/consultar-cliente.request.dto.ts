import { PlexConsultarClienteParsed } from '../interfaces/consultar-cliente-parsed.interface';

export interface PlexConsultarClienteRequestDto {
  codAccion: string; // Siempre "300"
  nroTarjeta: string;
}

export class PlexConsultarClienteRequestMapper {
  static fromXml(obj: unknown): PlexConsultarClienteRequestDto {
    const { MensajeFidelyGB } = obj as PlexConsultarClienteParsed;
    return {
      codAccion: MensajeFidelyGB.CodAccion ?? '',
      nroTarjeta: MensajeFidelyGB.NroTarjeta ?? '',
    };
  }
}
