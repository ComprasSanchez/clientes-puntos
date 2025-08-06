// MetricasQueueWorker.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CREAR_METRICA_CLIENTE_USECASE } from 'src/context/Metricas/core/reglas/tokens/tokens';
import { CrearMetricaClienteuseCase } from 'src/context/Metricas/application/clientes/use-cases/CrearMetricaCliente';
import { Operacion } from '@puntos/core/entities/Operacion';
import { OperacionPrimitives } from '@puntos/core/interfaces/OperacionPrimitives';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TransaccionPrimitives } from '@puntos/core/interfaces/TransaccionPrimitives';

// Puede estar en un archivo shared de infra de metricas-queue
export interface MetricasJobPayload {
  operacion: OperacionPrimitives;
  transacciones: TransaccionPrimitives[];
}

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
  async process(job: Job<MetricasJobPayload>): Promise<void> {
    try {
      const { operacion, transacciones } = job.data;

      const OpEntity = Operacion.fromPrimitives(operacion);
      const txEntities = transacciones.map((tx) =>
        Transaccion.fromPrimitives(tx),
      );

      // Aquí podés reconstruir las entidades si hace falta
      await this.crearMetricaClienteUseCase.run(OpEntity, txEntities);
    } catch (error) {
      this.logger.error('Error en MetricasQueueWorker', error);
      throw error;
    }
  }
}
