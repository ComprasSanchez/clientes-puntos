// dtos/plex-fidelizar-cliente.response.dto.ts

import { DatosClienteResponseDto } from '../interfaces/datos-cliente-parsed.interface';

export interface PlexFidelizarClienteResponseDto {
  respCode: string;
  respMsg: string;
  idClienteFidely: string;
  nroTarjeta: string;
}

export class PlexFidelizarClienteResponseMapper {
  static fromDomain(
    domain: DatosClienteResponseDto,
  ): PlexFidelizarClienteResponseDto {
    return {
      respCode: '0',
      respMsg: 'OK',
      idClienteFidely: domain.idClienteFidely,
      nroTarjeta: domain.nroTarjeta,
    };
  }

  static toXml(dto: PlexFidelizarClienteResponseDto) {
    return {
      RespuestaFidelyGb: {
        RespCode: dto.respCode,
        RespMsg: dto.respMsg,
        Cliente: {
          IDClienteFidely: dto.idClienteFidely.toString(),
          NroTarjeta: dto.nroTarjeta.toString(),
        },
      },
    };
  }
}
