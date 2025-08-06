// src/context/Metricas/infrastructure/metricas-queue.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';

@Injectable()
export class MetricasQueueService {
  constructor(
    @InjectQueue('metricas-cliente')
    private readonly queue: Queue,
  ) {}

  async crearMetricaCliente(
    operacion: Operacion,
    transacciones: Transaccion[],
  ) {
    await this.queue.add('crear-metrica', {
      operacion: operacion.toPrimitives(),
      transacciones: transacciones.map((tx) => tx.toPrimitives()),
    });
  }
}
