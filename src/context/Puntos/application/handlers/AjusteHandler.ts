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
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';

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
    const saldoAnterior = saldo.getSaldoActual();

    // 1) Crear operación + ejecutar reglas
    const operacion = this.operacionFactory.create(req);
    const instrucciones = await operacion.ejecutarEn(saldo, this.reglaEngine);

    // 2) Elegir la cantidad según el tipo (con fallback a req.puntos)
    let total: CantidadPuntos | undefined;

    if (tipoAjuste === TxTipo.ACREDITACION) {
      // En acreditación esperamos créditos; si no hay, usamos req.puntos como crédito
      total =
        instrucciones.creditos?.[0]?.cantidad ??
        (typeof req.puntos === 'number' && req.puntos > 0
          ? new CantidadPuntos(req.puntos)
          : undefined);
    } else if (tipoAjuste === TxTipo.GASTO) {
      // En gasto esperamos débitos; si no hay, usamos req.puntos como débito
      total =
        instrucciones.debitos?.[0]?.cantidad ??
        (typeof req.puntos === 'number' && req.puntos > 0
          ? new CantidadPuntos(req.puntos)
          : undefined);
    } else {
      throw new Error('Tipo de ajuste no soportado');
    }

    // 3) Aplicar ajuste con el monto resuelto
    const { detallesDebito, nuevoLote } = this.saldoHandler.aplicarAjuste(
      saldo,
      operacion,
      tipoAjuste,
      total,
    );

    // 4) Transacciones
    const transacciones = this.txBuilder.buildTransacciones(
      detallesDebito,
      nuevoLote,
      operacion,
      req,
      instrucciones.reglasAplicadas,
    );

    // 5) Persistir saldo
    await this.saldoHandler.persistirCambiosDeSaldo(operacion, saldo, ctx);

    // 6) Lotes actualizados (sin el nuevo lote recién creado)
    const lotesActualizados = saldo
      .getLotes()
      .filter((l) => !nuevoLote || l.id.value !== nuevoLote.id.value)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
