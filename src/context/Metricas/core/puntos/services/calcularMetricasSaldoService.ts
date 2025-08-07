// core/services/CalcularMetricasSaldoService.ts

import { SaldoClienteDto } from '@puntos/core/interfaces/SaldoResponseDTO';
import { MetricasSaldo } from '../entities/MetricasSaldo';

export class CalcularMetricasSaldoService {
  run(saldos: SaldoClienteDto[], totalUsuarios: number): MetricasSaldo {
    // 1. Suma total de puntos en el sistema
    const saldoTotal = saldos.reduce((acc, curr) => acc + curr.puntos.value, 0);

    // 2. Usuarios con saldo > 0
    const usuariosConSaldo = saldos.filter((s) => s.puntos.value > 0).length;

    // 3. Promedio de saldo por usuario con saldo
    const promedioPorUsuario =
      usuariosConSaldo > 0 ? saldoTotal / usuariosConSaldo : 0;

    return new MetricasSaldo(
      saldoTotal,
      promedioPorUsuario,
      totalUsuarios,
      usuariosConSaldo,
    );
  }
}
