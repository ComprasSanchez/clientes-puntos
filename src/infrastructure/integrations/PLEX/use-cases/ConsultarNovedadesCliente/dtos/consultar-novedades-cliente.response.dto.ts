import { ClienteResponseDto } from '@cliente/application/dtos/ClienteResponseDto';

export interface PlexNovedadClienteDto {
  idClienteFidely: string;
  categoria: string;
  nroTarjeta: string;
  nombre: string;
  apellido: string;
  fecNac: string;
  dni: string;
  telefono: string;
  direccion: string;
  email: string;
  sexo: string;
  codPostal: string;
  localidad: string;
  provincia: string;
  sucursal: string;
}

export interface PlexConsultarNovedadesClienteResponseDto {
  respCode: string;
  respMsg: string;
  novedades: PlexNovedadClienteDto[];
}

export class PlexConsultarNovedadesClienteResponseMapper {
  static fromDomain(params: {
    clientes: ClienteResponseDto[];
    sucursal: string;
  }): PlexConsultarNovedadesClienteResponseDto {
    return {
      respCode: '0',
      respMsg: 'OK',
      novedades: params.clientes.map((cliente) => ({
        idClienteFidely: String(cliente.idFidely ?? ''),
        categoria: String(cliente.categoria ?? ''),
        nroTarjeta: cliente.tarjetaFidely ?? '',
        nombre: cliente.nombre ?? '',
        apellido: cliente.apellido ?? '',
        fecNac: cliente.fechaNacimiento ?? '',
        dni: normalizeDniForOutput(cliente.dni ?? ''),
        telefono: cliente.telefono ?? '',
        direccion: cliente.direccion ?? '',
        email: cliente.email ?? '',
        sexo: cliente.sexo ?? '',
        codPostal: cliente.codPostal ?? '',
        localidad: cliente.localidad ?? '',
        provincia: cliente.provincia ?? '',
        sucursal: params.sucursal,
      })),
    };
  }

  static toXml(dto: PlexConsultarNovedadesClienteResponseDto): unknown {
    const clientesXml = dto.novedades.map((novedad) => ({
      IdClienteFidely: novedad.idClienteFidely,
      Categoria: novedad.categoria,
      NroTarjeta: novedad.nroTarjeta,
      Nombre: novedad.nombre,
      Apellido: novedad.apellido,
      FecNac: novedad.fecNac,
      Dni: novedad.dni,
      Telefono: novedad.telefono,
      Direccion: novedad.direccion,
      Email: novedad.email,
      Sexo: novedad.sexo,
      CodPostal: novedad.codPostal,
      Localidad: novedad.localidad,
      Provincia: novedad.provincia,
      Sucursal: novedad.sucursal,
    }));

    return {
      RespuestaFidelyGb: {
        RespCode: dto.respCode,
        RespMsg: dto.respMsg,
        Novedades: {
          Cliente: clientesXml,
        },
        Clientes: {
          Cliente: clientesXml,
        },
      },
    };
  }
}

function normalizeDniForOutput(value: string): string {
  const trimmed = String(value ?? '').trim();
  const noLeadingZeros = trimmed.replace(/^0+/, '');
  return noLeadingZeros.length > 0 ? noLeadingZeros : trimmed;
}
