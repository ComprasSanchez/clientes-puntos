// application/use-cases/CargarMetricasSaldo.ts

import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { SALDO_REPO } from '@puntos/core/tokens/tokens';
import { MetricasSaldo } from 'src/context/Metricas/core/puntos/entities/MetricasSaldo';
import { CalcularMetricasSaldoService } from 'src/context/Metricas/core/puntos/services/calcularMetricasSaldoService';
import { CALCULAR_SALDO_METRICAS_SERVICE } from 'src/context/Metricas/core/reglas/tokens/tokens';

@Injectable()
export class CargarMetricasSaldo {
  private readonly logger = new Logger(CargarMetricasSaldo.name);

  constructor(
    @Inject(SALDO_REPO)
    private readonly saldoRepo: SaldoRepository,
    @Inject(CLIENTE_REPO)
    private readonly clienteRepo: ClienteRepository,
    @Inject(CALCULAR_SALDO_METRICAS_SERVICE)
    private readonly calcularMetricasSaldo: CalcularMetricasSaldoService,
  ) {}

  async run(): Promise<MetricasSaldo> {
    this.logger.log(`Calculando métricas de saldo`);

    // 1. Traer todos los saldos actuales
    const saldos = await this.saldoRepo.findAll(); // [{ usuarioId, saldo }]
    // 2. Traer total de usuarios (puede estar en otro repo, adaptalo si hace falta)
    const totalUsuarios = await this.clienteRepo.countAll();

    // 3. Calcular KPIs de saldo
    const metricas = this.calcularMetricasSaldo.run(saldos, totalUsuarios);

    this.logger.log('Métricas de saldo calculadas correctamente');
    return metricas;
  }
}
