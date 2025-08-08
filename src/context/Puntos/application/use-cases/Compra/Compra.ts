import { OpTipo } from '@shared/core/enums/OpTipo';
import { CreateOperacionRequest } from '../../dtos/CreateOperacionRequest';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { CREATE_OPERACION_SERVICE } from '@puntos/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { MetricasQueueService } from 'src/context/Metricas/infrastructure/MetricasQueue/MetricasQueueService';
import { METRICAS_QEUE_SERVICE } from 'src/context/Metricas/infrastructure/MetricasQueue/tokens';

@Injectable()
export class CompraUseCase {
  constructor(
    @Inject(CREATE_OPERACION_SERVICE)
    private readonly service: CreateOperacionService,
    @Inject(METRICAS_QEUE_SERVICE)
    private readonly metricasQueue: MetricasQueueService,
  ) {}

  async run(
    input: OperacionDto,
    ctx?: TransactionContext,
  ): Promise<CreateOperacionResponse> {
    // 1️⃣ Validar/conversiones de primitivos a VOs
    const origenVO = new OrigenOperacion(input.origenTipo);
    const referenciaVO = input.referencia
      ? new ReferenciaMovimiento(input.referencia)
      : undefined;
    const operacionIdVO = input.refOperacion
      ? OperacionId.instance(input.refOperacion)
      : undefined;

    // 2️⃣ Armar el request interno
    const req: CreateOperacionRequest = {
      clienteId: input.clienteId,
      tipo: OpTipo.COMPRA,
      origenTipo: origenVO,
      puntos: input.puntos,
      montoMoneda: input.montoMoneda,
      moneda: input.moneda,
      referencia: referenciaVO,
      operacionId: operacionIdVO,
      codSucursal: input.codSucursal,
    };

    const response = this.service.execute(req, ctx);

    // Dispara el proceso de métricas en background
    if (
      (await response).handlerResult.operacion &&
      (await response).handlerResult.transacciones
    ) {
      await this.metricasQueue.crearMetricaCliente(
        (await response).handlerResult.operacion,
        (await response).handlerResult.transacciones,
      );
    }

    // 3️⃣ Delegar al service
    return response;
  }
}
