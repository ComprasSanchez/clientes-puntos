import { ConsultarEstadisticaClienteDomainResponse } from '../interfaces/consultar-estadisticas-domain.interface';

export interface PlexConsultarEstadisticaClienteResponseDto {
  respCode: string;
  respMsg: string;
  cliente: {
    idClienteFidely: number;
    categoria: number;
    saldoPuntos: number;
    pesosAhorroUltimoMes: number;
    pesosAhorro3Meses: number;
    puntosUltimoMes: number;
    puntos3Meses: number;
    movimientosUltimoMes: number;
    movimientos3Meses: number;
  };
}

export class PlexConsultarEstadisticaClienteResponseMapper {
  static fromDomain(
    domain: ConsultarEstadisticaClienteDomainResponse,
  ): PlexConsultarEstadisticaClienteResponseDto {
    return {
      respCode: '0',
      respMsg: 'OK',
      cliente: {
        idClienteFidely: domain.idClienteFidely,
        categoria: domain.categoria,
        saldoPuntos: domain.saldoPuntos,
        pesosAhorroUltimoMes: domain.pesosAhorroUltimoMes,
        pesosAhorro3Meses: domain.pesosAhorro3Meses,
        puntosUltimoMes: domain.puntosUltimoMes,
        puntos3Meses: domain.puntos3Meses,
        movimientosUltimoMes: domain.movimientosUltimoMes,
        movimientos3Meses: domain.movimientos3Meses,
      },
    };
  }

  static toXml(dto: PlexConsultarEstadisticaClienteResponseDto): any {
    return {
      RespuestaFidelyGb: {
        RespCode: dto.respCode,
        RespMsg: dto.respMsg,
        Cliente: {
          IdClienteFidely: dto.cliente.idClienteFidely,
          Categoria: dto.cliente.categoria,
          SaldoPuntos: dto.cliente.saldoPuntos,
          PesosAhorroUltimoMes: dto.cliente.pesosAhorroUltimoMes,
          PesosAhorro3Meses: dto.cliente.pesosAhorro3Meses,
          PuntosUltimoMes: dto.cliente.puntosUltimoMes,
          Puntos3Meses: dto.cliente.puntos3Meses,
          MovimientosUltimoMes: dto.cliente.movimientosUltimoMes,
          Movimientos3Meses: dto.cliente.movimientos3Meses,
        },
      },
    };
  }
}
