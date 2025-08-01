import { Injectable, Inject } from '@nestjs/common';
import { OperacionFactory } from '@puntos/core/factories/OperacionFactory';
import { SaldoHandler } from './SaldoHandler';
import { TransaccionBuilder } from '../services/Transaccionbuilder';
import { IReglaEngine } from '@puntos/core/interfaces/IReglaEngine';
import {
  SALDO_HANDLER,
  OP_FACTORY,
  TX_BUILDER,
  REGLA_ENGINE,
} from '@puntos/core/tokens/tokens';
import { CreateOperacionRequest } from '../dtos/CreateOperacionRequest';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { HandlerResult } from '../dtos/HandlerResult';
import { Saldo } from '@puntos/core/entities/Saldo';
import { Transaccion } from '@puntos/core/entities/Transaccion';

@Injectable()
export class DevolucionHandler {
  constructor(
    @Inject(OP_FACTORY)
    private readonly operacionFactory: OperacionFactory,
    @Inject(SALDO_HANDLER) private readonly saldoHandler: SaldoHandler,
    @Inject(TX_BUILDER) private readonly txBuilder: TransaccionBuilder,
    @Inject(REGLA_ENGINE) private readonly reglaEngine: IReglaEngine,
  ) {}

  async handle(
    req: CreateOperacionRequest,
    saldo: Saldo,
    transaccionesOriginales: Transaccion[], // txsOriginal (puede ser [])
    ctx?: TransactionContext,
  ): Promise<HandlerResult> {
    // 1. Crear la operación
    const operacion = this.operacionFactory.create(req);

    // 2. Ejecutar reglas de devolución si corresponde
    const instrucciones = await operacion.ejecutarEn(saldo, this.reglaEngine);

    // 3. Aplicar la devolución en saldo
    const { detallesDebito, nuevoLote } = this.saldoHandler.aplicarDevolucion(
      saldo,
      operacion,
      instrucciones.debitos[0]?.cantidad,
      instrucciones.creditos[0]
        ? {
            cantidad: instrucciones.creditos[0].cantidad,
            expiraEn: instrucciones.creditos[0].expiraEn,
          }
        : undefined,
      transaccionesOriginales,
    );

    await this.saldoHandler.persistirCambiosDeSaldo(operacion, saldo, ctx);

    // 4. Generar transacciones con el builder
    const transacciones = this.txBuilder.buildTransacciones(
      req.tipo,
      detallesDebito,
      nuevoLote,
      operacion,
      req,
      instrucciones.reglasAplicadas ?? [],
    );

    // 5. Obtener lotes actualizados (excluyendo el nuevo lote, si lo hay)
    const lotesActualizados = saldo
      .getLotes()
      .filter((lote) => !nuevoLote || lote.id.value !== nuevoLote.id.value)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    // 6. Snapshot de saldo antes/después
    const saldoAnterior = saldo.getSaldoActual();
    const saldoNuevo = saldo.getSaldoActual();

    // 7. Retornar el resultado para que el servicio central persista
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
