/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
// @puntos/core/services/SaldoHandler.ts
import { Saldo } from '../entities/Saldo';
import { LoteFactory } from '../factories/LoteFactory';
import { Lote } from '../entities/Lote';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { Operacion } from '../entities/Operacion';
import { FechaExpiracion } from '../value-objects/FechaExpiracion';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { Transaccion } from '../entities/Transaccion';
import { LoteId } from '../value-objects/LoteId';

export interface AplicacionCambioResult {
  detallesDebito: Array<{ loteId: LoteId; cantidad: CantidadPuntos }>;
  nuevoLote?: Lote;
}

export class SaldoHandler {
  constructor(private readonly loteFactory: LoteFactory) {}

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
      for (const { loteId, cantidad } of txs) {
        saldo.revertirLinea(loteId.value, cantidad);
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
