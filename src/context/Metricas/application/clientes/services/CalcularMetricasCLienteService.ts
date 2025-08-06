import { Injectable } from '@nestjs/common';
import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';
import { ClienteMetricasResumen } from '../dto/ClienteMetricasResumen';

@Injectable()
export class CalcularMetricasClienteService {
  calcular(metricas: ClienteMetrica[]): ClienteMetricasResumen {
    const ahora = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(ahora.getMonth() - 1);
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(ahora.getMonth() - 3);

    // Filtra últimos 3 meses (por si el array incluye más)
    const metricas3Meses = metricas.filter(
      (m) => m.fecha >= haceTresMeses && m.fecha <= ahora,
    );
    const metricasUltimoMes = metricas3Meses.filter(
      (m) => m.fecha >= haceUnMes,
    );

    // Acumuladores
    const pesosAhorroUltimoMes = metricasUltimoMes.reduce(
      (a, m) => a + m.pesosAhorro,
      0,
    );
    const pesosAhorro3Meses = metricas3Meses.reduce(
      (a, m) => a + m.pesosAhorro,
      0,
    );

    const puntosUltimoMes = metricasUltimoMes.reduce(
      (a, m) => a + m.puntosAdquiridos,
      0,
    );
    const puntos3Meses = metricas3Meses.reduce(
      (a, m) => a + m.puntosAdquiridos,
      0,
    );

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
}
