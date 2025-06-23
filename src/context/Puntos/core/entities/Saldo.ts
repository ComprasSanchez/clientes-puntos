// src/domain/aggregates/Saldo.ts
import { Transaccion } from '../entities/Transaccion';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { BatchEstado } from '../enums/BatchEstado';
import { Lote } from './Lote';
import { LoteNotFoundError } from '../exceptions/Lote/LoteNotFoundError';
import { SaldoInsuficienteError } from '../exceptions/Saldo/SaldoInsuficienteError';

export class Saldo {
  private readonly clienteId: string;
  private readonly lotes: Lote[] = [];
  private readonly transacciones: Transaccion[] = [];

  constructor(
    clienteId: string,
    lotes: Lote[] = [],
    transacciones: Transaccion[] = [],
    private consumos: Array<{ loteId: string; cantidad: number }> = [],
  ) {
    this.clienteId = clienteId;
    this.lotes = lotes;
    this.transacciones = transacciones;
  }

  getSaldoActual(): CantidadPuntos {
    const total = this.lotes
      .filter((l) => l.estado === BatchEstado.DISPONIBLE)
      .reduce((acc, lote) => acc + lote.remaining.value, 0);
    return new CantidadPuntos(total);
  }

  // 1️⃣ Comportamiento puro de crédito: añade el lote
  añadirLote(lote: Lote): void {
    this.lotes.push(lote);
  }

  // 2️⃣ Comportamiento puro de gasto: consume hasta agotar o lanzar excepción
  consumirPuntos(cantidad: CantidadPuntos): void {
    let pendiente = cantidad.value;
    this.consumos = [];

    const disponibles = this.lotes
      .filter(
        (l) => l.estado === BatchEstado.DISPONIBLE && l.remaining.value > 0,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const lote of disponibles) {
      if (pendiente <= 0) break;
      const take = Math.min(lote.remaining.value, pendiente);
      lote.consumir(new CantidadPuntos(take));
      pendiente -= take;
      this.consumos.push({ loteId: lote.id.value, cantidad: take });
    }

    if (pendiente > 0) {
      throw new SaldoInsuficienteError(pendiente);
    }
  }

  getDetalleConsumo(): Array<{ loteId: string; cantidad: number }> {
    return [...this.consumos];
  }

  // 3️⃣ Comportamiento puro de reversión
  revertirPuntos(loteId: string, cantidad: CantidadPuntos): void {
    const lote = this.lotes.find((l) => l.id.value === loteId);
    if (!lote) throw new LoteNotFoundError(loteId);
    lote.revertir(cantidad);
  }

  // 4️⃣ Expiraciones como lógica de dominio
  procesarExpiraciones(): Lote[] {
    const expirados: Lote[] = [];
    const ahora = new Date();

    for (const lote of this.lotes) {
      // 1️⃣ Extraemos la fecha de expiración (podría ser undefined)
      const fechaExpira = lote.expiraEn?.value;

      // 2️⃣ Hacemos el guard clause: lote DISPONIBLE y fechaExpira definida y anterior a 'ahora'
      if (
        lote.estado === BatchEstado.DISPONIBLE &&
        fechaExpira !== undefined &&
        fechaExpira < ahora
      ) {
        lote.marcarExpirado();
        expirados.push(lote);
      }
    }

    return expirados;
  }
}
