// metricas/application/clientes/dto/ClienteMetricasDashboardDto.ts

export type TimeRangeKey = '1d' | '7d' | '1m' | '3m' | '6m' | '1y' | 'max';

export interface RangeSummaryDto {
  from: string; // ISO date string
  to: string; // ISO date string
  pesosAhorro: number;
  puntosAdquiridos: number;
  operaciones: number;
}

export interface TimeSeriesPointDto {
  bucket: string; // e.g. '2025-03-10', '2025-W11', '2025-03'
  from: string;
  to: string;
  pesosAhorro: number;
  puntosAdquiridos: number;
  operaciones: number;
}

export interface HistorialSaldoItemDto {
  fechaCambio: string;
  saldoAnterior: number;
  saldoNuevo: number;
  motivo: string;
  referenciaOperacion?: number;
}

export interface ClienteMetricasDashboardDto {
  clienteId: string;
  now: string;

  // Totales globales (sobre todas las métricas cargadas)
  totalPesosAhorro: number;
  totalPuntos: number;
  totalOperaciones: number;

  // Saldo actual
  currentBalance: number;

  // Resumen por rangos estándar
  ranges: Record<TimeRangeKey, RangeSummaryDto>;

  // Series para gráficos (pueden usarse para líneas/barras)
  dailySeries: TimeSeriesPointDto[];
  weeklySeries: TimeSeriesPointDto[];
  monthlySeries: TimeSeriesPointDto[];

  // Historial de saldo del cliente
  saldoHistory: HistorialSaldoItemDto[];
}
