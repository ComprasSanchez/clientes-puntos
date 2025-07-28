// plex-fidelizar-venta.response.dto.ts

import { OperacionVentaDomainResponse } from '../interfaces/operacion-venta-parsed.interface';

export class PlexFidelizarVentaResponseDto {
  respCode: string;
  respMsg: string;
  idMovimiento: string;
  puntosDescontados: number;
  puntosAcreditados: number;
  totalPuntosCliente: number;

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
}
