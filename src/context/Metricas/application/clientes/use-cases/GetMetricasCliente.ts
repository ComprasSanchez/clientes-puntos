import { Inject, Injectable } from '@nestjs/common';
import { ClienteMetricaRepository } from 'src/context/Metricas/core/clientes/repositories/ClienteMetrica.repository';
import { METRICAS_REPO } from 'src/context/Metricas/core/clientes/tokens/tokens';
import { CalcularMetricasClienteService } from '../services/CalcularMetricasCLienteService';
import { ClienteMetricasResumen } from '../dto/ClienteMetricasResumen';
import { CALCULAR_METRICAS_SERVICE } from 'src/context/Metricas/core/reglas/tokens/tokens';

@Injectable()
export class GetMetricasCliente {
  constructor(
    @Inject(METRICAS_REPO)
    private readonly clienteMetricaRepo: ClienteMetricaRepository,
    @Inject(CALCULAR_METRICAS_SERVICE)
    private readonly calc: CalcularMetricasClienteService,
  ) {}

  async run(
    clienteId: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ClienteMetricasResumen> {
    const metricas = await this.clienteMetricaRepo.findByClienteIdAndDateRange(
      clienteId,
      fechaInicio,
      fechaFin,
    );

    return this.calc.calcular(metricas);
  }
}
