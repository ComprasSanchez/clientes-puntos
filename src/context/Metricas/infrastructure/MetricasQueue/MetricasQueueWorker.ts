/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// MetricasQueueWorker.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CREAR_METRICA_CLIENTE_USECASE } from 'src/context/Metricas/core/reglas/tokens/tokens';
import { CrearMetricaClienteuseCase } from 'src/context/Metricas/application/clientes/use-cases/CrearMetricaCliente';

@Injectable()
@Processor('metricas-cliente')
export class MetricasQueueWorker extends WorkerHost {
  private readonly logger = new Logger(MetricasQueueWorker.name);

  constructor(
    @Inject(CREAR_METRICA_CLIENTE_USECASE)
    private readonly crearMetricaClienteUseCase: CrearMetricaClienteuseCase,
  ) {
    super();
  }

  // Override the process method
  async process(job: Job): Promise<void> {
    try {
      const { operacion, transacciones } = job.data;
      // Aquí podés reconstruir las entidades si hace falta
      await this.crearMetricaClienteUseCase.run(operacion, transacciones);
    } catch (error) {
      this.logger.error('Error en MetricasQueueWorker', error);
      throw error;
    }
  }
}
