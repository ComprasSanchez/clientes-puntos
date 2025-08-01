// @puntos/core/services/SaldoHandler.ts
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { LoteFactory } from '../../core/factories/LoteFactory';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { Lote } from '@puntos/core/entities/Lote';
import { Saldo } from '@puntos/core/entities/Saldo';
import { Operacion } from '@puntos/core/entities/Operacion';
import { FechaExpiracion } from '@puntos/core/value-objects/FechaExpiracion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { Inject, Injectable } from '@nestjs/common';
import { LOTE_FACTORY, SALDO_REPO } from '@puntos/core/tokens/tokens';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { MontoNotFoundError } from '@puntos/core/exceptions/Saldo/MontoNotFoundError';
import { ReferenciaoNotFoundError } from '@puntos/core/exceptions/Operacion/ReferenciaRequiredError';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { HistorialSaldo } from '@puntos/core/entities/SaldoHistorial';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';

export interface AplicacionCambioResult {
  detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }>;
  nuevoLote?: Lote;
}

@Injectable()
export class SaldoHandler {
  constructor(
    @Inject(LOTE_FACTORY) private readonly loteFactory: LoteFactory,
    @Inject(SALDO_REPO) private readonly saldoRepo: SaldoRepository,
  ) {}

  // --- Métodos privados por tipo de operación ---

  aplicarCompra(
    saldo: Saldo,
    operacion: Operacion,
    totalDebito?: CantidadPuntos,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
  ): AplicacionCambioResult {
    let detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> =
      [];
    let nuevoLote: Lote | undefined = undefined;

    // Debito (COMPRA con puntos)
    if (totalDebito && totalDebito.value > 0) {
      saldo.consumirPuntos(operacion.id.value, totalDebito);
      detallesDebito = saldo
        .getDetalleConsumo(operacion.id.value)
        .map((d) => ({ loteId: d.loteId, cantidad: d.cantidad }));
    }

    // Crédito (COMPRA con dinero): SOLO aquí se permite crear un nuevo lote
    if (credito && credito.cantidad.value > 0) {
      nuevoLote = this.loteFactory.crear({
        clienteId: operacion.clienteId,
        cantidad: credito.cantidad,
        origen: operacion.origenTipo,
        referencia: operacion.refOperacion,
        expiraEn: credito.expiraEn,
      });
      saldo.añadirLote(nuevoLote);
    }

    return { detallesDebito, nuevoLote };
  }

  aplicarAjuste(
    saldo: Saldo,
    operacion: Operacion,
    ajusteTipo: TxTipo,
    totalDebito: CantidadPuntos,
  ): AplicacionCambioResult {
    let detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> =
      [];
    let nuevoLote: Lote | undefined = undefined;

    // Debito (COMPRA con puntos)
    if (totalDebito && totalDebito.value > 0) {
      if (ajusteTipo === TxTipo.GASTO) {
        saldo.consumirPuntos(operacion.id.value, totalDebito);
        detallesDebito = saldo
          .getDetalleConsumo(operacion.id.value)
          .map((d) => ({ loteId: d.loteId, cantidad: d.cantidad }));
      } else if (ajusteTipo === TxTipo.ACREDITACION) {
        nuevoLote = this.loteFactory.crear({
          clienteId: operacion.clienteId,
          cantidad: totalDebito,
          origen: operacion.origenTipo,
          referencia: operacion.refOperacion,
          expiraEn: undefined,
        });
        saldo.añadirLote(nuevoLote);
      }
    } else throw new MontoNotFoundError();

    return { detallesDebito, nuevoLote };
  }

  aplicarDevolucion(
    saldo: Saldo,
    operacion: Operacion,
    totalDebito?: CantidadPuntos,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
    txs?: Transaccion[],
  ): AplicacionCambioResult {
    const detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> =
      [];

    if (!txs || txs.length === 0) {
      if (!credito || credito.cantidad.value <= 0)
        throw new MontoNotFoundError();
      // Gasto puntos por el valor devuelto, con cotización de canje
      saldo.consumirPuntos(operacion.id.value, credito.cantidad);
      detallesDebito.push(...saldo.getDetalleConsumo(operacion.id.value));
      return { detallesDebito };
    }

    if (operacion.monto) {
      // DEVOLUCIÓN de compra en dinero: "gasta" puntos equivalentes, pero NO acredita lote nuevo
      if (!credito || credito.cantidad.value <= 0)
        throw new MontoNotFoundError();

      // Desgastar puntos SOLO de los lotes y cantidades indicadas por las transacciones originales
      let remaining = credito.cantidad.value;

      for (const tx of txs) {
        const lote = saldo.obtenerLote(tx.loteId.value);
        if (!lote || remaining <= 0) continue;

        // Tomar la mínima cantidad entre lo pendiente y lo disponible en el lote
        const cantidadAGastar = Math.min(
          remaining,
          tx.cantidad.value,
          lote.remaining.value,
        );
        if (cantidadAGastar > 0) {
          saldo.gastarLinea(
            tx.loteId.value,
            new CantidadPuntos(cantidadAGastar),
          );
          detallesDebito.push({
            loteId: tx.loteId,
            cantidad: new CantidadPuntos(cantidadAGastar),
          });
          remaining -= cantidadAGastar;
        }
      }
    } else {
      // DEVOLUCIÓN de compra con puntos: revertir los puntos realmente devueltos
      const cantidadADevolver = totalDebito ?? credito?.cantidad;
      if (!cantidadADevolver || cantidadADevolver.value <= 0)
        throw new MontoNotFoundError();

      let remaining = cantidadADevolver.value;

      for (const tx of txs) {
        const lote = saldo.obtenerLote(tx.loteId.value);
        if (!lote || remaining <= 0) continue;

        // Se puede devolver hasta la cantidad gastada en ese lote originalmente
        const cantidadARevertir = Math.min(
          remaining,
          tx.cantidad.value,
          lote.cantidadOriginal.value - lote.remaining.value,
        );
        if (cantidadARevertir > 0) {
          saldo.revertirLinea(
            tx.loteId.value,
            new CantidadPuntos(cantidadARevertir),
          );
          detallesDebito.push({
            loteId: tx.loteId,
            cantidad: new CantidadPuntos(cantidadARevertir),
          });
          remaining -= cantidadARevertir;
        }
      }
    }

    return { detallesDebito };
  }

  aplicarAnulacion(
    saldo: Saldo,
    operacion: Operacion,
    txs?: Transaccion[],
  ): AplicacionCambioResult {
    if (!txs) {
      throw new ReferenciaoNotFoundError();
    }

    for (const tx of txs) {
      const { loteId, cantidad, tipo, createdAt } = tx;
      if (
        operacion.tipo === OpTipo.ANULACION &&
        createdAt.getDate() !== new Date().getDate()
      )
        throw new Error('Solo se puede anular una transacción del mismo día');

      const lote = saldo.obtenerLote(loteId.value);
      if (!lote) continue;

      if (tipo === TxTipo.ACREDITACION) {
        const puntosDisponibles = lote.remaining.value;
        if (puntosDisponibles >= cantidad.value) {
          saldo.gastarLinea(loteId.value, cantidad);
        } else if (puntosDisponibles > 0) {
          saldo.gastarLinea(
            loteId.value,
            new CantidadPuntos(puntosDisponibles),
          );
        } else {
          throw new Error(
            `No quedan puntos disponibles para anular en el lote ${loteId.value}`,
          );
        }
      } else if (tipo === TxTipo.GASTO) {
        saldo.revertirLinea(loteId.value, cantidad);
      }
    }

    const detallesDebito = txs.map((d) => ({
      loteId: d.loteId,
      cantidad: d.cantidad,
    }));

    return { detallesDebito };
  }

  async persistirCambiosDeSaldo(
    operacion: Operacion,
    saldo: Saldo,
    ctx?: TransactionContext,
  ): Promise<void> {
    const saldoAnterior = await this.saldoRepo.findByClienteId(
      operacion.clienteId,
    );
    const saldoActual = saldo.getSaldoCalculado().value;

    // Actualiza saldo
    await this.saldoRepo.updateSaldo(operacion.clienteId, saldoActual, ctx);

    // Guarda historial
    const historial = new HistorialSaldo(
      undefined,
      operacion.clienteId,
      new CantidadPuntos(saldoAnterior?.value ?? 0),
      new CantidadPuntos(saldoActual),
      operacion.tipo,
      operacion.id,
      new Date(),
    );
    await this.saldoRepo.saveHistorial(historial, ctx);
  }
}
