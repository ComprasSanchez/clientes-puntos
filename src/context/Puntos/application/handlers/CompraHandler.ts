import { Inject, Injectable } from '@nestjs/common';
import { IReglaEngine } from '@puntos/core/interfaces/IReglaEngine';
import { SaldoHandler } from './SaldoHandler';
import {
  OP_FACTORY,
  SALDO_HANDLER,
  TX_BUILDER,
} from '@puntos/core/tokens/tokens';
import { REGLA_ENGINE_ADAPTER } from '@regla/core/tokens/tokens';
import { CreateOperacionRequest } from '../dtos/CreateOperacionRequest';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { HandlerResult } from '../dtos/HandlerResult';
import { Saldo } from '@puntos/core/entities/Saldo';
import { OperacionFactory } from '@puntos/core/factories/OperacionFactory';
import { obtenerLotesActualizados } from '../utils/ObtenerLotesActualizados';
import { TransaccionBuilder } from '../services/Transaccionbuilder';

@Injectable()
export class CompraHandler {
  constructor(
    @Inject(REGLA_ENGINE_ADAPTER) private readonly reglaEngine: IReglaEngine,
    @Inject(TX_BUILDER) private readonly txBuilder: TransaccionBuilder,
    @Inject(OP_FACTORY) private readonly opFactory: OperacionFactory,
    @Inject(SALDO_HANDLER) private readonly saldoHandler: SaldoHandler,
  ) {}

  async handle(
    req: CreateOperacionRequest,
    saldo: Saldo,
    ctx?: TransactionContext,
  ): Promise<HandlerResult> {
    const saldoAnterior = saldo.getSaldoActual();

    // 1. Instanciar operación (usa la factory)
    const operacion = this.opFactory.create(req);

    // 2. Ejecutar reglas y obtener instrucciones
    const instrucciones = await operacion.ejecutarEn(saldo, this.reglaEngine);

    // 3. Aplicar instrucciones al saldo (handler)
    const { detallesDebito, nuevoLote } = this.saldoHandler.aplicarCompra(
      saldo,
      operacion,
      instrucciones.debitos[0]?.cantidad,
      instrucciones.creditos[0]
        ? {
            cantidad: instrucciones.creditos[0].cantidad,
            expiraEn: instrucciones.creditos[0].expiraEn,
          }
        : undefined,
    );

    await this.saldoHandler.persistirCambiosDeSaldo(operacion, saldo, ctx);

    // 4. Lotes actualizados y transacciones (helpers reusables)
    const lotesActualizados = obtenerLotesActualizados(saldo, nuevoLote);

    const transacciones = this.txBuilder.buildTransacciones(
      req.tipo,
      detallesDebito,
      nuevoLote,
      operacion,
      req,
      instrucciones.reglasAplicadas,
    );

    const saldoNuevo = saldo.getSaldoActual();

    return {
      nuevoLote,
      lotesActualizados,
      transacciones,
      operacion,
      saldoNuevo: saldoNuevo.value,
      saldoAnterior: saldoAnterior.value,
    };
  }
}
