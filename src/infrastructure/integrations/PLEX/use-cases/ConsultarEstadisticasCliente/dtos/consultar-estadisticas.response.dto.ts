import { ConsultarEstadisticaClienteDomainResponse } from '../interfaces/consultar-estadisticas-domain.interface';

export interface PlexConsultarEstadisticaClienteResponseDto {
  respCode: string;
  respMsg: string;
  cliente: {
    idClienteFidely: string;
    categoria: string;
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
        RespCode: { _text: dto.respCode },
        RespMsg: { _text: dto.respMsg },
        Cliente: {
          IdClienteFidely: { _text: dto.cliente.idClienteFidely },
          Categoria: { _text: dto.cliente.categoria },
          SaldoPuntos: { _text: dto.cliente.saldoPuntos.toString() },
          PesosAhorroUltimoMes: {
            _text: dto.cliente.pesosAhorroUltimoMes.toString(),
          },
          PesosAhorro3Meses: {
            _text: dto.cliente.pesosAhorro3Meses.toString(),
          },
          PuntosUltimoMes: { _text: dto.cliente.puntosUltimoMes.toString() },
          Puntos3Meses: { _text: dto.cliente.puntos3Meses.toString() },
          MovimientosUltimoMes: {
            _text: dto.cliente.movimientosUltimoMes.toString(),
          },
          Movimientos3Meses: {
            _text: dto.cliente.movimientos3Meses.toString(),
          },
        },
      },
    };
  }
}
