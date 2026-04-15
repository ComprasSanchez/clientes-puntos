// dtos/plex-fidelizar-cliente.request.dto.ts

import { PlexFidelizarClienteFXPParsed } from '../interfaces/fidelizar-cliente-parsed.interface';
import {
  normalizeNameLike,
  normalizeOptionalText,
  normalizePhone,
  normalizePostalCode,
  normalizeSexo,
} from '@infrastructure/integrations/PLEX/utils/cliente-input-sanitizer';

export interface PlexFidelizarClienteRequestDto {
  codAccion: string;
  idClienteFidely?: string;
  campania?: string;
  categoria?: string;
  nroTarjetaAnterior?: string;
  nroTarjeta?: string;
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
    const { MensajeFidelyGB } = obj as PlexFidelizarClienteFXPParsed;
    const cliente = MensajeFidelyGB.Cliente ?? {};
    const codAccion = MensajeFidelyGB.CodAccion
      ? String(MensajeFidelyGB.CodAccion).trim()
      : '';
    const idClienteFidelyRaw =
      cliente.IDClienteFidely !== undefined &&
      cliente.IDClienteFidely !== null &&
      String(cliente.IDClienteFidely).trim() !== ''
        ? String(cliente.IDClienteFidely).trim()
        : undefined;

    return {
      codAccion,
      idClienteFidely:
        codAccion === '100' || codAccion === '103'
          ? undefined
          : idClienteFidelyRaw,
      campania: normalizeOptionalText(
        cliente.Campania ? String(cliente.Campania) : undefined,
      ),
      categoria: cliente.Categoria
        ? String(cliente.Categoria).trim()
        : undefined,
      nroTarjetaAnterior: cliente.NroTarjetaAnterior
        ? String(cliente.NroTarjetaAnterior).trim()
        : undefined,
      nroTarjeta: cliente.NroTarjeta
        ? String(cliente.NroTarjeta).trim()
        : undefined,
      dni: cliente.DNI ? String(cliente.DNI).trim() : '',
      nombre:
        normalizeNameLike(
          cliente.Nombre ? String(cliente.Nombre) : undefined,
        ) ?? '',
      apellido:
        normalizeNameLike(
          cliente.Apellido ? String(cliente.Apellido) : undefined,
        ) ?? '',
      sexo: normalizeSexo(cliente.Sexo ? String(cliente.Sexo) : undefined),
      fecNac: cliente.FecNac ? String(cliente.FecNac).trim() : undefined,
      email: normalizeOptionalText(
        cliente.Email ? String(cliente.Email) : undefined,
      ),
      telefono: normalizePhone(
        cliente.Telefono ? String(cliente.Telefono) : undefined,
      ),
      direccion: cliente.Direccion
        ? normalizeOptionalText(String(cliente.Direccion))
        : undefined,
      codPostal: normalizePostalCode(
        cliente.CodPostal ? String(cliente.CodPostal) : undefined,
      ),
      localidad: cliente.Localidad
        ? normalizeNameLike(String(cliente.Localidad))
        : undefined,
      provincia: cliente.Provincia
        ? normalizeNameLike(String(cliente.Provincia))
        : undefined,
    };
  }
}
