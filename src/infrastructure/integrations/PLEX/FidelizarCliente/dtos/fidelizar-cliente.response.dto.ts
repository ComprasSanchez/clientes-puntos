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

  static toXml(dto: PlexFidelizarClienteResponseDto): any {
    return {
      RespuestaFidelyGb: {
        RespCode: { _text: dto.respCode },
        RespMsg: { _text: dto.respMsg },
        Cliente: {
          IDClienteFidely: { _text: dto.idClienteFidely },
          NroTarjeta: { _text: dto.nroTarjeta },
        },
      },
    };
  }
}
