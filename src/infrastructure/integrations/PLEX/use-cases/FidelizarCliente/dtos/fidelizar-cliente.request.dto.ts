// dtos/plex-fidelizar-cliente.request.dto.ts

import { PlexFidelizarClienteParsed } from '../interfaces/fidelizar-cliente-parsed.interface';

export interface PlexFidelizarClienteRequestDto {
  codAccion: string;
  idClienteFidely?: string;
  campania?: string;
  categoria?: string;
  nroTarjetaAnterior?: string;
  nroTarjeta: string;
  dni: string;
  nombre: string;
  apellido: string;
  sexo?: string;
  fecNac?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  codPostal?: string;
  localidad?: string;
  provincia?: string;
}

export class PlexFidelizarClienteRequestMapper {
  static fromXml(obj: unknown): PlexFidelizarClienteRequestDto {
    const { MensajeFidelyGb } = obj as PlexFidelizarClienteParsed;
    const cliente = MensajeFidelyGb.Cliente;
    return {
      codAccion: MensajeFidelyGb.CodAccion?._text ?? '',
      idClienteFidely: cliente.IDClienteFidely?._text,
      campania: cliente.Campania?._text,
      categoria: cliente.Categoria?._text,
      nroTarjetaAnterior: cliente.NroTarjetaAnterior?._text,
      nroTarjeta: cliente.NroTarjeta?._text ?? '',
      dni: cliente.DNI?._text ?? '',
      nombre: cliente.Nombre?._text ?? '',
      apellido: cliente.Apellido?._text ?? '',
      sexo: cliente.Sexo?._text,
      fecNac: cliente.FecNac?._text,
      email: cliente.Email?._text,
      telefono: cliente.Telefono?._text,
      direccion: cliente.Direccion?._text,
      codPostal: cliente.CodPostal?._text,
      localidad: cliente.Localidad?._text,
      provincia: cliente.Provincia?._text,
    };
  }
}
