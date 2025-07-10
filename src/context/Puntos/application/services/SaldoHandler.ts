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
import { TransaccionesNotFoundError } from '@puntos/core/exceptions/Transaccion/TransaccionesNotFoundError';
import { MontoNotFoundError } from '@puntos/core/exceptions/Saldo/MontoNotFoundError';
import { ReferenciaoNotFoundError } from '@puntos/core/exceptions/Operacion/ReferenciaRequiredError';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { HistorialSaldo } from '@puntos/core/entities/SaldoHistorial';

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

  async aplicarCambio(
    saldo: Saldo,
    operacion: Operacion,
    totalDebito?: CantidadPuntos,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
    txs?: Transaccion[],
  ): Promise<AplicacionCambioResult> {
    let result: AplicacionCambioResult;

    switch (operacion.tipo) {
      case OpTipo.COMPRA:
        result = this.aplicarCompra(saldo, operacion, totalDebito, credito);
        break;
      case OpTipo.DEVOLUCION:
        result = this.aplicarDevolucion(
          saldo,
          operacion,
          totalDebito,
          credito,
          txs,
        );
        break;
      case OpTipo.ANULACION:
        result = this.aplicarAnulacion(saldo, operacion, txs);
        break;
      default:
        throw new Error(`Tipo de operación no soportado`);
    }

    // 1️⃣ Calcula el saldo actual después del cambio
    const saldoAnterior = await this.saldoRepo.findByClienteId(
      operacion.clienteId,
    );
    const saldoActual = saldo.getSaldoActual().value;

    // 2️⃣ Actualiza saldo precalculado (y si no existe, lo crea)
    await this.saldoRepo.updateSaldo(
      operacion.clienteId,
      saldoActual,
      operacion.tipo, // motivo
      operacion.id.value, // referenciaOperacion (number)
    );

    // 3️⃣ Guarda el historial explícitamente, si quieres lógica de dominio avanzada
    const historial = new HistorialSaldo(
      '',
      operacion.clienteId,
      new CantidadPuntos(saldoAnterior?.value ?? 0),
      new CantidadPuntos(saldoActual),
      operacion.tipo,
      operacion.id,
      new Date(),
    );
    await this.saldoRepo.saveHistorial(historial);

    return result;
  }

  // --- Métodos privados por tipo de operación ---

  private aplicarCompra(
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

  private aplicarDevolucion(
    saldo: Saldo,
    operacion: Operacion,
    totalDebito?: CantidadPuntos,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
    txs?: Transaccion[],
  ): AplicacionCambioResult {
    const detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> =
      [];

    if (!txs || txs.length === 0) {
      throw new TransaccionesNotFoundError(operacion.id.value.toString());
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

  private aplicarAnulacion(
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
}
