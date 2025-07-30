// dtos/plex-fidelizar-cliente.request.dto.ts

import { PlexFidelizarClienteFXPParsed } from '../interfaces/fidelizar-cliente-parsed.interface';

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
    // Cambiá el tipado para el parser nuevo
    const { MensajeFidelyGb } = obj as PlexFidelizarClienteFXPParsed;
    const cliente = MensajeFidelyGb.Cliente ?? {};

    return {
      codAccion: MensajeFidelyGb.CodAccion
        ? String(MensajeFidelyGb.CodAccion).trim()
        : '',
      idClienteFidely: cliente.IDClienteFidely
        ? String(cliente.IDClienteFidely).trim()
        : undefined,
      campania: cliente.Campania ? String(cliente.Campania).trim() : undefined,
      categoria: cliente.Categoria
        ? String(cliente.Categoria).trim()
        : undefined,
      nroTarjetaAnterior: cliente.NroTarjetaAnterior
        ? String(cliente.NroTarjetaAnterior).trim()
        : undefined,
      nroTarjeta: cliente.NroTarjeta ? String(cliente.NroTarjeta).trim() : '',
      dni: cliente.DNI ? String(cliente.DNI).trim() : '',
      nombre: cliente.Nombre ? String(cliente.Nombre).trim() : '',
      apellido: cliente.Apellido ? String(cliente.Apellido).trim() : '',
      sexo: cliente.Sexo ? String(cliente.Sexo).trim() : undefined,
      fecNac: cliente.FecNac ? String(cliente.FecNac).trim() : undefined,
      email: cliente.Email ? String(cliente.Email).trim() : undefined,
      telefono: cliente.Telefono ? String(cliente.Telefono).trim() : undefined,
      direccion: cliente.Direccion
        ? String(cliente.Direccion).trim()
        : undefined,
      codPostal: cliente.CodPostal
        ? String(cliente.CodPostal).trim()
        : undefined,
      localidad: cliente.Localidad
        ? String(cliente.Localidad).trim()
        : undefined,
      provincia: cliente.Provincia
        ? String(cliente.Provincia).trim()
        : undefined,
    };
  }
}
