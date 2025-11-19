// src/application/use-cases/operacion/FindOperacionDetalleByIdUseCase.ts
import { Inject, Injectable } from '@nestjs/common';
import {
  OPERACION_REPO,
  OPERACION_VALOR_SERVICE,
} from '@puntos/core/tokens/tokens';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import {
  ValorOperacionDetallado,
  OperacionValorService,
} from '@puntos/application/services/OperacionValorService';
import {
  ClienteBasicData,
  ClienteQueryPort,
} from '@puntos/core/interfaces/ClienteQuery';
import { CLIENTE_QUERY_PORT } from '@cliente/core/tokens/tokens';

export interface OperacionDetalleView {
  operacion: Operacion;
  valor: ValorOperacionDetallado;
  transacciones: Transaccion[];
  cliente: ClienteBasicData | null;
}

@Injectable()
export class FindOperacionDetalleByIdUseCase {
  constructor(
    @Inject(OPERACION_REPO)
    private readonly operacionRepo: OperacionRepository,
    @Inject(OPERACION_VALOR_SERVICE)
    private readonly operacionValorService: OperacionValorService,
    @Inject(CLIENTE_QUERY_PORT)
    private readonly clienteQueryPort: ClienteQueryPort,
  ) {}

  async run(id: OperacionId): Promise<OperacionDetalleView | null> {
    const operacion = await this.operacionRepo.findById(id);

    if (!operacion) {
      return null;
    }

    // En paralelo: detalle de valor + datos del cliente
    const [detalleValor, cliente] = await Promise.all([
      this.operacionValorService.obtenerDetalleOperacion(operacion),
      this.clienteQueryPort.findById(operacion.clienteId),
    ]);

    return {
      operacion,
      valor: detalleValor.valor,
      transacciones: detalleValor.transacciones,
      cliente,
    };
  }
}
