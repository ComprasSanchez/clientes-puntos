import { OpTipo } from 'src/shared/core/enums/OpTipo';
import { CreateOperacionRequest } from '../../dtos/CreateOperacionRequest';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';

export class CompraUseCase {
  constructor(private readonly service: CreateOperacionService) {}

  async run(input: OperacionDto): Promise<CreateOperacionResponse> {
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
    };

    // 3️⃣ Delegar al service
    return this.service.execute(req);
  }
}
