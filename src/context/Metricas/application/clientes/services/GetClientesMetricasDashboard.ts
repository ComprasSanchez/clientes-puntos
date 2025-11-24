// metricas/application/clientes/use-cases/GetClienteMetricasDashboard.ts

import { Inject, Injectable } from '@nestjs/common';
import { ClienteMetricaRepository } from 'src/context/Metricas/core/clientes/repositories/ClienteMetrica.repository';
import { METRICAS_REPO } from 'src/context/Metricas/core/clientes/tokens/tokens';
import { CalcularMetricasClienteService } from './CalcularMetricasCLienteService';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { GetHistorialSaldoCliente } from '@puntos/application/use-cases/ObtenerHistorialSaldo/GetHistorialSaldoCliente';
import { ClienteMetricasDashboardDto } from '../dto/ClienteMetricasDTO';
import {
  OBTENER_HSITORIAL_SALDO,
  OBTENER_SALDO_SERVICE,
} from '@puntos/core/tokens/tokens';
import { CALCULAR_METRICAS_SERVICE } from 'src/context/Metricas/core/reglas/tokens/tokens';

@Injectable()
export class GetClienteMetricasDashboard {
  constructor(
    @Inject(METRICAS_REPO)
    private readonly clienteMetricaRepo: ClienteMetricaRepository,
    @Inject(CALCULAR_METRICAS_SERVICE)
    private readonly calc: CalcularMetricasClienteService,
    @Inject(OBTENER_SALDO_SERVICE)
    private readonly obtenerSaldo: ObtenerSaldo,
    @Inject(OBTENER_HSITORIAL_SALDO)
    private readonly getHistorialSaldo: GetHistorialSaldoCliente,
  ) {}

  /**
   * Dashboard completo de métricas del cliente.
   * El rango principal lo fijás en la consulta al repo (ej. últimos 12/24 meses)
   */
  async run(
    clienteId: string,
    desde: Date,
    hasta: Date,
  ): Promise<ClienteMetricasDashboardDto> {
    const metricas = await this.clienteMetricaRepo.findByClienteIdAndDateRange(
      clienteId,
      desde,
      hasta,
    );

    const core = this.calc.calcularDashboardCore(clienteId, metricas, hasta);

    const currentBalance = await this.obtenerSaldo.run(clienteId);
    const saldoHistory = await this.getHistorialSaldo.run(clienteId);

    return {
      ...core,
      currentBalance,
      saldoHistory,
    };
  }
}
