// src/context/Metricas/infrastructure/metricas-queue.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';

@Injectable()
export class MetricasQueueService {
  private readonly logger = new Logger(MetricasQueueService.name);

  constructor(
    @InjectQueue('metricas-cliente')
    private readonly queue: Queue,
  ) {}

  private buildJobId(operacionId: number): string {
    return `metricas-cliente:${operacionId}`;
  }

  async crearMetricaCliente(
    operacion: Operacion,
    transacciones: Transaccion[],
  ) {
    const jobId = this.buildJobId(operacion.id.value);

    await this.queue.add(
      'crear-metrica',
      {
        operacion: operacion.toPrimitives(),
        transacciones: transacciones.map((tx) => tx.toPrimitives()),
      },
      {
        jobId,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000, // 3 segundos iniciales
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );

    this.logger.log(
      `Metrica encolada: jobId=${jobId} opId=${operacion.id.value}`,
    );
  }
}
