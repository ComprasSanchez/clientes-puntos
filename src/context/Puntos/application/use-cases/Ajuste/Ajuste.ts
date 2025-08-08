import { OpTipo } from '@shared/core/enums/OpTipo';
import { CreateOperacionRequest } from '../../dtos/CreateOperacionRequest';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import {
  AJUSTE_REPO,
  CREATE_OPERACION_SERVICE,
} from '@puntos/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { AjusteRepository } from '@puntos/core/repository/AjusteRepository';
import { Ajuste } from '@puntos/core/entities/Ajuste';
import { AjusteDto } from '@puntos/application/dtos/AjusteDto';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { METRICAS_QEUE_SERVICE } from 'src/context/Metricas/infrastructure/MetricasQueue/tokens';
import { MetricasQueueService } from 'src/context/Metricas/infrastructure/MetricasQueue/MetricasQueueService';

@Injectable()
export class AjusteUseCase {
  constructor(
    @Inject(CREATE_OPERACION_SERVICE)
    private readonly service: CreateOperacionService,
    @Inject(METRICAS_QEUE_SERVICE)
    private readonly metricasQueue: MetricasQueueService,
    @Inject(AJUSTE_REPO)
    private readonly ajusteRepo: AjusteRepository,
    @Inject(UUIDGenerator)
    private readonly idGen: UUIDGenerator,
  ) {}

  async run(
    tipo: TxTipo,
    userId: string,
    input: AjusteDto,
    ctx?: TransactionContext,
  ): Promise<CreateOperacionResponse> {
    const uuid = this.idGen.generate();
    const ajuste = new Ajuste(
      uuid,
      userId,
      input.clienteId,
      tipo,
      input.puntos,
      new Date(),
      input.motivo ?? undefined,
    );

    // 1️⃣ Validar/conversiones de primitivos a VOs
    const origenVO = new OrigenOperacion(input.origenTipo);
    const referenciaVO = new ReferenciaMovimiento(uuid);
    const operacionIdVO = input.refOperacion
      ? OperacionId.instance(input.refOperacion)
      : undefined;

    // 2️⃣ Armar el request interno
    const req: CreateOperacionRequest = {
      clienteId: input.clienteId,
      tipo: OpTipo.AJUSTE,
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

    await this.ajusteRepo.save(ajuste, ctx);

    // 3️⃣ Delegar al service
    return response;
  }
}
