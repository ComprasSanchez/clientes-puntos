// src/application/handlers/AjusteHandler.ts
import { Injectable, Inject } from '@nestjs/common';
import { OperacionFactory } from '@puntos/core/factories/OperacionFactory';
import { SaldoHandler } from './SaldoHandler';
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
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { Saldo } from '@puntos/core/entities/Saldo';
import { TransaccionBuilder } from '../services/Transaccionbuilder';

@Injectable()
export class AjusteHandler {
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
    tipoAjuste: TxTipo,
    ctx?: TransactionContext,
  ): Promise<HandlerResult> {
    // 1. Crear la operación usando el factory
    const operacion = this.operacionFactory.create(req);

    const instrucciones = await operacion.ejecutarEn(saldo, this.reglaEngine);

    const { detallesDebito, nuevoLote } = this.saldoHandler.aplicarAjuste(
      saldo,
      operacion,
      tipoAjuste,
      instrucciones.debitos[0]?.cantidad,
    );

    // 4. Generar transacciones (builder centralizado, para auditar motivos)
    const transacciones = this.txBuilder.buildTransacciones(
      req.tipo,
      detallesDebito,
      nuevoLote,
      operacion,
      req,
      instrucciones.reglasAplicadas,
    );

    await this.saldoHandler.persistirCambiosDeSaldo(operacion, saldo, ctx);

    // 5. Obtener lotes actualizados (sin el nuevo lote)
    const lotesActualizados = saldo
      .getLotes()
      .filter((l) => !nuevoLote || l.id.value !== nuevoLote.id.value)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    // 6. Snapshot de saldo antes/después
    const saldoAnterior = saldo.getSaldoActual();
    const saldoNuevo = saldo.getSaldoActual();

    // 7. Retornar el resultado
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
