// dtos/plex-fidelizar-venta.response.dto.ts

import { OperacionVentaDomainResponse } from '../interfaces/operacion-venta-parsed.interface';

export interface PlexFidelizarVentaResponseDto {
  respCode: string;
  respMsg: string;
  idMovimiento: string;
  puntosDescontados: number;
  puntosAcreditados: number;
  totalPuntosCliente: number;
}

export class PlexFidelizarVentaResponseMapper {
  static fromDomain(
    domain: OperacionVentaDomainResponse,
  ): PlexFidelizarVentaResponseDto {
    return {
      respCode: '0',
      respMsg: 'OK',
      idMovimiento: domain.idMovimiento,
      puntosDescontados: domain.puntosDescontados,
      puntosAcreditados: domain.puntosAcreditados,
      totalPuntosCliente: domain.totalPuntosCliente,
    };
  }

  static toXml(dto: PlexFidelizarVentaResponseDto) {
    return {
      RespuestaFidelyGb: {
        RespCode: dto.respCode,
        RespMsg: dto.respMsg,
        Venta: {
          IdMovimiento: dto.idMovimiento,
          PuntosDescontados: dto.puntosDescontados.toString(),
          PuntosAcreditados: dto.puntosAcreditados.toString(),
          TotalPuntosCliente: dto.totalPuntosCliente?.toString() || '0',
        },
      },
    };
  }
}
