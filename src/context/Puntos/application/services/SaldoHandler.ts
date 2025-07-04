/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
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
import { LOTE_FACTORY } from '@puntos/core/tokens/tokens';
import { TxTipo } from '@puntos/core/enums/TxTipo';

export interface AplicacionCambioResult {
  detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }>;
  nuevoLote?: Lote;
}

@Injectable()
export class SaldoHandler {
  constructor(
    @Inject(LOTE_FACTORY) private readonly loteFactory: LoteFactory,
  ) {}

  aplicarCambio(
    saldo: Saldo,
    operacion: Operacion,
    totalDebito?: CantidadPuntos,
    credito?: { cantidad: CantidadPuntos; expiraEn?: FechaExpiracion },
    txs?: Transaccion[],
  ): AplicacionCambioResult {
    let detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> =
      [];
    let nuevoLote: Lote | undefined = undefined;

    // ─── 1️⃣ DÉBITO vs DEVOLUCIÓN/ANULACIÓN ─────────────────────────────
    if (operacion.tipo === OpTipo.COMPRA) {
      // ➤ Si es compra, aplico FIFO normal
      if (totalDebito?.value! > 0) {
        saldo.consumirPuntos(operacion.id.value, totalDebito!);
        detallesDebito = saldo
          .getDetalleConsumo(operacion.id.value)
          .map((d) => ({ loteId: d.loteId, cantidad: d.cantidad }));
      }
    } else {
      // ➤ Si NO es compra (es devolución o anulación),
      //    debo revertir la operación referenciada
      if (!txs) {
        throw new Error(
          `Operación de tipo ${operacion.tipo} requiere refAnulacion`,
        );
      }

      // Revierto cada lote en orden inverso
      for (const tx of txs) {
        const { loteId, cantidad, tipo, createdAt } = tx;
        if (
          operacion.tipo === OpTipo.ANULACION &&
          createdAt.getDate() !== new Date().getDate()
        )
          throw new Error('solo se puede anular una transaccion del mismo dia');

        const lote = saldo.obtenerLote(loteId.value);
        if (!lote) continue;

        if (tipo === TxTipo.ACREDITACION) {
          // ¿Cuántos puntos quedan sin usar?
          const puntosDisponibles = lote.remaining.value;
          if (puntosDisponibles >= cantidad.value) {
            // Se puede anular completamente
            saldo.gastarLinea(loteId.value, cantidad); // método que descuente puntos del lote (simula gasto)
          } else if (puntosDisponibles > 0) {
            // Solo se puede anular parcialmente
            saldo.gastarLinea(
              loteId.value,
              new CantidadPuntos(puntosDisponibles),
            );
            // O lanzar un error/aviso
          } else {
            // No se puede anular, ya se gastaron todos los puntos de ese lote
            throw new Error(
              `No quedan puntos disponibles para anular en el lote ${loteId.value}`,
            );
          }
        } else if (tipo === TxTipo.GASTO) {
          // Caso clásico: devolver los puntos a los lotes de origen
          saldo.revertirLinea(loteId.value, cantidad);
        }
      }

      // Y guardo esos mismos puntos como “débitos” a efectos de transacción
      detallesDebito = txs.map((d) => ({
        loteId: d.loteId,
        cantidad: d.cantidad,
      }));
    }

    // ─── 2️⃣ CRÉDITO ─────────────────────────────────────────────────────
    if (credito?.cantidad.value! > 0) {
      nuevoLote = this.loteFactory.crear({
        clienteId: operacion.clienteId,
        cantidad: credito!.cantidad,
        origen: operacion.origenTipo,
        referencia: operacion.refOperacion,
        expiraEn: credito!.expiraEn,
      });
      saldo.añadirLote(nuevoLote);
    }

    return { detallesDebito, nuevoLote };
  }
}
