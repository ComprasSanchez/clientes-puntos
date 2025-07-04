// src/domain/aggregates/Saldo.ts
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { BatchEstado } from '../enums/BatchEstado';
import { Lote } from './Lote';
import { LoteNotFoundError } from '../exceptions/Lote/LoteNotFoundError';
import { SaldoInsuficienteError } from '../exceptions/Saldo/SaldoInsuficienteError';
import { LoteId } from '../value-objects/LoteId';
import { ConsumoNoRegistradoError } from '../exceptions/Saldo/ConsumoNoRegistradoError';
import { ReversionExcedidaError } from '../exceptions/Lote/ReversionExcedidaError';

export class Saldo {
  private readonly clienteId: string;
  private readonly lotes: Lote[] = [];

  constructor(
    clienteId: string,
    lotes: Lote[] = [],
    private consumosPorOperacion = new Map<
      number,
      Array<{ loteId: LoteId; cantidad: CantidadPuntos }>
    >(),
  ) {
    this.clienteId = clienteId;
    this.lotes = lotes;
  }

  getSaldoActual(): CantidadPuntos {
    const total = this.lotes
      .filter((l) => l.estado === BatchEstado.DISPONIBLE)
      .reduce((acc, lote) => acc + lote.remaining.value, 0);
    return new CantidadPuntos(total);
  }

  /** Retorna copia de todos los lotes del cliente */
  getLotes(): Lote[] {
    return [...this.lotes];
  }

  /** Busca y retorna un lote por su ID, o undefined si no existe */
  obtenerLote(loteId: string): Lote | undefined {
    return this.lotes.find((l) => l.id.value === loteId);
  }

  // 1️⃣ Comportamiento puro de crédito: añade el lote
  añadirLote(lote: Lote): void {
    this.lotes.push(lote);
  }

  // 2️⃣ Comportamiento puro de gasto: consume hasta agotar o lanzar excepción
  consumirPuntos(operacionId: number, cantidad: CantidadPuntos): void {
    let pendiente = cantidad.value;
    const detalle: Array<{ loteId: LoteId; cantidad: CantidadPuntos }> = [];

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
      detalle.push({ loteId: lote.id, cantidad: new CantidadPuntos(take) });
    }

    if (pendiente > 0) {
      throw new SaldoInsuficienteError(pendiente);
    }

    // Guardamos el detalle bajo este operacionId
    this.consumosPorOperacion.set(operacionId, detalle);
  }

  public gastarLinea(loteId: string, cantidad: CantidadPuntos): void {
    const lote = this.obtenerLote(loteId);
    if (!lote) throw new LoteNotFoundError(loteId);
    if (lote.remaining.value < cantidad.value) {
      throw new Error(
        `No hay suficientes puntos para gastar en el lote ${loteId}`,
      );
    }
    lote.consumir(cantidad);
  }

  // 3️⃣ Comportamiento puro de reversión
  /** Revierto X puntos directamente sobre el lote indicado */
  public revertirLinea(loteId: string, cantidad: CantidadPuntos): void {
    const lote = this.obtenerLote(loteId);
    if (!lote) throw new LoteNotFoundError(loteId);
    // Protejo de exceder el original
    const gastados = lote.cantidadOriginal.value - lote.remaining.value;
    if (cantidad.value > gastados) {
      throw new ReversionExcedidaError(loteId);
    }

    lote.revertir(cantidad);
  }

  getDetalleConsumo(
    operacionId: number,
  ): Array<{ loteId: LoteId; cantidad: CantidadPuntos }> {
    const detalle = this.consumosPorOperacion.get(operacionId);
    if (!detalle) {
      throw new ConsumoNoRegistradoError(operacionId);
    }
    // devolvemos una copia para proteger inmutabilidad
    return [...detalle];
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
