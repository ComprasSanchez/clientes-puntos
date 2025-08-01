import { Injectable, Inject } from '@nestjs/common';
import { OperacionFactory } from '@puntos/core/factories/OperacionFactory';
import { SaldoHandler } from './SaldoHandler';
import { TransaccionBuilder } from '../services/Transaccionbuilder';
import {
  SALDO_HANDLER,
  OP_FACTORY,
  TX_BUILDER,
} from '@puntos/core/tokens/tokens';
import { CreateOperacionRequest } from '../dtos/CreateOperacionRequest';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { HandlerResult } from '../dtos/HandlerResult';
import { Saldo } from '@puntos/core/entities/Saldo';
import { Transaccion } from '@puntos/core/entities/Transaccion';

@Injectable()
export class AnulacionHandler {
  constructor(
    @Inject(OP_FACTORY) private readonly operacionFactory: OperacionFactory,
    @Inject(SALDO_HANDLER) private readonly saldoHandler: SaldoHandler,
    @Inject(TX_BUILDER) private readonly txBuilder: TransaccionBuilder,
  ) {}

  async handle(
    req: CreateOperacionRequest,
    saldo: Saldo,
    transaccionesOriginales: Transaccion[],
    ctx?: TransactionContext,
  ): Promise<HandlerResult> {
    // 1. Crear la operación (la operación ANULACION)
    const operacion = this.operacionFactory.create(req);

    // 2. Aplicar la anulación al saldo usando las transacciones originales
    const { detallesDebito, nuevoLote } = this.saldoHandler.aplicarAnulacion(
      saldo,
      operacion,
      transaccionesOriginales,
    );

    // 3. Generar transacciones de ANULACION con el builder
    const transacciones = this.txBuilder.buildTransacciones(
      req.tipo, // OpTipo.ANULACION
      detallesDebito,
      nuevoLote,
      operacion,
      req,
      transaccionesOriginales[0].reglasAplicadas,
    );

    await this.saldoHandler.persistirCambiosDeSaldo(operacion, saldo, ctx);

    // 4. Lotes afectados (sin el nuevo lote, aunque normalmente en ANULACION nunca hay)
    const lotesActualizados = saldo
      .getLotes()
      .filter((l) => !nuevoLote || l.id.value !== nuevoLote.id.value)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    // 5. Snapshot de saldo antes/después
    const saldoAnterior = saldo.getSaldoActual();
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
