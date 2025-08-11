// core/interfaces/consultar-estadistica-cliente-domain-response.interface.ts

export interface ConsultarEstadisticaClienteDomainResponse {
  idClienteFidely: number;
  categoria: number;
  saldoPuntos: number;
  pesosAhorroUltimoMes: number;
  pesosAhorro3Meses: number;
  puntosUltimoMes: number;
  puntos3Meses: number;
  movimientosUltimoMes: number;
  movimientos3Meses: number;
}
