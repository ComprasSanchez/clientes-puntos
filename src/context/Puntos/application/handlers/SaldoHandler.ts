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

  // --- COMPRA ---
  /**
   * Aplica una compra: puede debitar puntos y/o acreditar nuevos puntos (nuevo lote).
   */
  aplicarCompra(
    saldo: Saldo,
    operacion: Operacion,
    totalDebito?: CantidadPuntos,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
  ): AplicacionCambioResult {
    const detallesDebito = this.consumirSiCorresponde(
      saldo,
      operacion,
      totalDebito,
    );
    const nuevoLote = this.acreditarSiCorresponde(saldo, operacion, credito);
    return { detallesDebito, nuevoLote };
  }

  // --- AJUSTE ---
  /**
   * Aplica un ajuste: puede ser un gasto o una acreditación directa.
   */
  aplicarAjuste(
    saldo: Saldo,
    operacion: Operacion,
    ajusteTipo: TxTipo,
    totalDebito: CantidadPuntos,
  ): AplicacionCambioResult {
    if (!totalDebito || totalDebito.value <= 0) throw new MontoNotFoundError();

    if (ajusteTipo === TxTipo.GASTO) {
      const detallesDebito = this.consumirSiCorresponde(
        saldo,
        operacion,
        totalDebito,
      );
      return { detallesDebito };
    }

    if (ajusteTipo === TxTipo.ACREDITACION) {
      const nuevoLote = this.acreditarSiCorresponde(saldo, operacion, {
        cantidad: totalDebito,
        expiraEn: undefined,
      });
      return { detallesDebito: [], nuevoLote };
    }

    throw new Error('Tipo de ajuste no soportado');
  }

  // --- DEVOLUCIÓN ---
  /**
   * Aplica una devolución. Puede o no tener transacciones originales.
   */
  aplicarDevolucion(
    saldo: Saldo,
    operacion: Operacion,
    totalDebito?: CantidadPuntos,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
    txs?: Transaccion[],
  ): AplicacionCambioResult {
    if (!txs || txs.length === 0) {
      if (!credito || credito.cantidad.value <= 0)
        throw new MontoNotFoundError();
      return {
        detallesDebito: this.consumirSiCorresponde(
          saldo,
          operacion,
          credito.cantidad,
        ),
      };
    }

    if (operacion.monto) {
      // Devolución de compra en dinero: solo gasta puntos de los lotes y cantidades de las transacciones originales
      if (!credito || credito.cantidad.value <= 0)
        throw new MontoNotFoundError();
      return {
        detallesDebito: this.gastarDeLotesOriginales(
          saldo,
          credito.cantidad,
          txs,
        ),
      };
    }

    // Devolución con puntos: revierte los puntos realmente devueltos
    const cantidadADevolver = totalDebito ?? credito?.cantidad;
    if (!cantidadADevolver || cantidadADevolver.value <= 0)
      throw new MontoNotFoundError();
    return {
      detallesDebito: this.revertirDeLotesOriginales(
        saldo,
        cantidadADevolver,
        txs,
      ),
    };
  }

  // --- ANULACIÓN ---
  /**
   * Aplica una anulación: revierte los efectos de una operación anterior.
   */
  aplicarAnulacion(
    saldo: Saldo,
    operacion: Operacion,
    txs?: Transaccion[],
  ): AplicacionCambioResult {
    if (!txs) throw new ReferenciaoNotFoundError();

    for (const tx of txs) {
      if (
        operacion.tipo === OpTipo.ANULACION &&
        !this.mismaFecha(tx.createdAt, new Date())
      ) {
        throw new Error('Solo se puede anular una transacción del mismo día');
      }
      const lote = saldo.obtenerLote(tx.loteId.value);
      if (!lote) continue;

      if (tx.tipo === TxTipo.ACREDITACION) {
        // Revierto la acreditación (quito puntos disponibles)
        this.gastarPuntosDeLote(lote, tx.cantidad);
      } else if (tx.tipo === TxTipo.GASTO) {
        // Revierto el gasto (devuelvo puntos)
        saldo.revertirLinea(tx.loteId.value, tx.cantidad);
      }
    }

    const detallesDebito = txs.map((d) => ({
      loteId: d.loteId,
      cantidad: d.cantidad,
    }));
    return { detallesDebito };
  }

  // --- Helpers privados ---

  private consumirSiCorresponde(
    saldo: Saldo,
    operacion: Operacion,
    cantidad?: CantidadPuntos,
  ): Array<{ loteId: LoteId; cantidad: CantidadPuntos }> {
    if (cantidad && cantidad.value > 0) {
      saldo.consumirPuntos(operacion.id.value, cantidad);
      return saldo.getDetalleConsumo(operacion.id.value).map((d) => ({
        loteId: d.loteId,
        cantidad: d.cantidad,
      }));
    }
    return [];
  }

  private acreditarSiCorresponde(
    saldo: Saldo,
    operacion: Operacion,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
  ): Lote | undefined {
    if (credito && credito.cantidad.value > 0) {
      const nuevoLote = this.loteFactory.crear({
        clienteId: operacion.clienteId,
        cantidad: credito.cantidad,
        origen: operacion.origenTipo,
        referencia: operacion.refOperacion,
        expiraEn: credito.expiraEn,
      });
      saldo.añadirLote(nuevoLote);
      return nuevoLote;
    }
    return undefined;
  }

  private gastarDeLotesOriginales(
    saldo: Saldo,
    cantidad: CantidadPuntos,
    txs: Transaccion[],
  ): Array<{ loteId: LoteId; cantidad: CantidadPuntos }> {
    let remaining = cantidad.value;
    const detalles: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> = [];

    for (const tx of txs) {
      if (remaining <= 0) break;
      const lote = saldo.obtenerLote(tx.loteId.value);
      if (!lote) continue;

      const cantidadAGastar = Math.min(
        remaining,
        tx.cantidad.value,
        lote.remaining.value,
      );
      if (cantidadAGastar > 0) {
        saldo.gastarLinea(tx.loteId.value, new CantidadPuntos(cantidadAGastar));
        detalles.push({
          loteId: tx.loteId,
          cantidad: new CantidadPuntos(cantidadAGastar),
        });
        remaining -= cantidadAGastar;
      }
    }
    return detalles;
  }

  private revertirDeLotesOriginales(
    saldo: Saldo,
    cantidadADevolver: CantidadPuntos,
    txs: Transaccion[],
  ): Array<{ loteId: LoteId; cantidad: CantidadPuntos }> {
    let remaining = cantidadADevolver.value;
    const detalles: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> = [];

    for (const tx of txs) {
      if (remaining <= 0) break;
      const lote = saldo.obtenerLote(tx.loteId.value);
      if (!lote) continue;
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
        detalles.push({
          loteId: tx.loteId,
          cantidad: new CantidadPuntos(cantidadARevertir),
        });
        remaining -= cantidadARevertir;
      }
    }
    return detalles;
  }

  private gastarPuntosDeLote(lote: Lote, cantidad: CantidadPuntos): void {
    // Si hay suficientes puntos, los gasta; si no, gasta lo que hay
    const puntosDisponibles = lote.remaining.value;
    if (puntosDisponibles >= cantidad.value) {
      lote.consumir(cantidad);
    } else if (puntosDisponibles > 0) {
      lote.consumir(new CantidadPuntos(puntosDisponibles));
    } else {
      throw new Error(
        `No quedan puntos disponibles para anular en el lote ${lote.id.value}`,
      );
    }
  }

  private mismaFecha(dateA: Date, dateB: Date): boolean {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  /**
   * Persiste los cambios en saldo y el historial correspondiente.
   */
  async persistirCambiosDeSaldo(
    operacion: Operacion,
    saldo: Saldo,
    ctx?: TransactionContext,
  ): Promise<void> {
    const saldoAnterior = await this.saldoRepo.findByClienteId(
      operacion.clienteId,
    );
    const saldoActual = saldo.getSaldoCalculado().value;

    await this.saldoRepo.updateSaldo(operacion.clienteId, saldoActual, ctx);

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
