// src/context/Metricas/application/clientes/services/CalcularMetricasClienteService.ts

import { Injectable } from '@nestjs/common';
import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';
import { ClienteMetricasResumen } from '../dto/ClienteMetricasResumen';
import { ClienteMetricasDashboardDto } from '../dto/ClienteMetricasDTO';

import {
  buildRanges,
  buildDailySeries,
  buildWeeklySeries,
  buildMonthlySeries,
  sumPesos,
  sumPuntos,
} from './helpers/MetricasClienteHelpers';

@Injectable()
export class CalcularMetricasClienteService {
  calcular(metricas: ClienteMetrica[]): ClienteMetricasResumen {
    const ahora = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(ahora.getMonth() - 1);
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(ahora.getMonth() - 3);

    const metricas3Meses = metricas.filter(
      (m) => m.fecha >= haceTresMeses && m.fecha <= ahora,
    );
    const metricasUltimoMes = metricas3Meses.filter(
      (m) => m.fecha >= haceUnMes,
    );

    const pesosAhorroUltimoMes = sumPesos(metricasUltimoMes);
    const pesosAhorro3Meses = sumPesos(metricas3Meses);

    const puntosUltimoMes = sumPuntos(metricasUltimoMes);
    const puntos3Meses = sumPuntos(metricas3Meses);

    const movimientosUltimoMes = metricasUltimoMes.length;
    const movimientos3Meses = metricas3Meses.length;

    return {
      pesosAhorroUltimoMes,
      pesosAhorro3Meses,
      puntosUltimoMes,
      puntos3Meses,
      movimientosUltimoMes,
      movimientos3Meses,
    };
  }

  calcularDashboardCore(
    clienteId: string,
    metricas: ClienteMetrica[],
    now: Date = new Date(),
  ): Pick<
    ClienteMetricasDashboardDto,
    | 'clienteId'
    | 'now'
    | 'totalPesosAhorro'
    | 'totalPuntos'
    | 'totalOperaciones'
    | 'ranges'
    | 'dailySeries'
    | 'weeklySeries'
    | 'monthlySeries'
  > {
    const normalizedNow = new Date(now);

    const totalPesosAhorro = sumPesos(metricas);
    const totalPuntos = sumPuntos(metricas);
    const totalOperaciones = metricas.length;

    const ranges = buildRanges(metricas, normalizedNow);
    const dailySeries = buildDailySeries(metricas);
    const weeklySeries = buildWeeklySeries(metricas);
    const monthlySeries = buildMonthlySeries(metricas);

    return {
      clienteId,
      now: normalizedNow.toISOString(),
      totalPesosAhorro,
      totalPuntos,
      totalOperaciones,
      ranges,
      dailySeries,
      weeklySeries,
      monthlySeries,
    };
  }
}
