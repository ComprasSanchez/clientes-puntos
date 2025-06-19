import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { Transaccion } from './Transaccion';
import { Lote } from './PuntosLote';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { BatchEstado } from '../enums/BatchEstado';
import { ReferenciaMovimiento } from '../value-objects/ReferenciaMovimiento';
import { TxTipo } from '../enums/TxTipo';
import { TransaccionId } from '../value-objects/TransaccionId';

export class Saldo {
  private readonly _clienteId: ClienteId;
  private _lotes: Lote[];
  private _transacciones: Transaccion[];

  constructor(
    clienteId: ClienteId,
    lotes: Lote[] = [],
    transacciones: Transaccion[] = [],
  ) {
    this._clienteId = clienteId;
    this._lotes = lotes;
    this._transacciones = transacciones;
  }

  get clienteId(): ClienteId {
    return this._clienteId;
  }

  get lotes(): Lote[] {
    return [...this._lotes];
  }

  get transacciones(): Transaccion[] {
    return [...this._transacciones];
  }

  /** Saldo actual = suma de remaining de lotes DISPONIBLES */
  get saldoActual(): CantidadPuntos {
    const total = this._lotes
      .filter((l) => l.estado === BatchEstado.DISPONIBLE)
      .reduce((acc, lote) => acc + lote.remaining.value, 0);
    return new CantidadPuntos(total);
  }

  /**
   * Agrega un nuevo lote y registra su acreditación en el ledger.
   * @param lote  Lote a crear
   * @param generarTxId  Función para generar nuevos TransaccionId
   * @param referenciaId  Referencia externa opcional
   */
  crearLote(
    lote: Lote,
    generarTxId: () => TransaccionId,
    referenciaId?: ReferenciaMovimiento,
  ): void {
    this._lotes.push(lote);
    this._transacciones.push(
      new Transaccion(
        generarTxId(),
        lote.id,
        TxTipo.ACREDITACION,
        lote.remaining,
        new Date(),
        referenciaId,
      ),
    );
  }

  /**
   * Gasta puntos en FIFO y registra transacciones de GASTO.
   * @param cantidad          Cantidad de puntos a gastar
   * @param generarTxId       Función para generar nuevos TransaccionId
   * @param referenciaId      Referencia externa opcional
   */
  gastar(
    cantidad: CantidadPuntos,
    generarTxId: () => TransaccionId,
    referenciaId?: ReferenciaMovimiento,
  ): void {
    let pendiente = cantidad.value;
    const disponibles = this._lotes
      .filter(
        (l) => l.estado === BatchEstado.DISPONIBLE && l.remaining.value > 0,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const lote of disponibles) {
      if (pendiente <= 0) break;
      const take = Math.min(lote.remaining.value, pendiente);
      lote.consumir(new CantidadPuntos(take));
      this._transacciones.push(
        new Transaccion(
          generarTxId(),
          lote.id,
          TxTipo.GASTO,
          new CantidadPuntos(take),
          new Date(),
          referenciaId,
        ),
      );
      pendiente -= take;
    }

    if (pendiente > 0) {
      throw new Error(
        `Saldo insuficiente: faltan ${pendiente} puntos para completar el gasto.`,
      );
    }
  }

  /**
   * Reembolsa puntos a un lote existente y registra la transacción de DEVOLUCION.
   * @param loteId            Identificador del lote
   * @param cantidad          Cantidad de puntos a devolver
   * @param generarTxId       Función para generar nuevos TransaccionId
   * @param referenciaId      Referencia externa opcional
   */
  devolver(
    loteId: Lote,
    cantidad: CantidadPuntos,
    generarTxId: () => TransaccionId,
    referenciaId?: ReferenciaMovimiento,
  ): void {
    const lote = this._lotes.find((l) => l.id.value === loteId.id.value);
    if (!lote) {
      throw new Error(`Lote ${loteId.id.value} no encontrado`);
    }
    lote.revertir(cantidad);
    this._transacciones.push(
      new Transaccion(
        generarTxId(),
        lote.id,
        TxTipo.DEVOLUCION,
        cantidad,
        new Date(),
        referenciaId,
      ),
    );
  }

  /**
   * Procesa expiraciones: marca lotes vencidos y registra transacciones de EXPIRACION.
   * @param generarTxId  Función para generar nuevos TransaccionId
   */
  procesarExpiraciones(generarTxId: () => TransaccionId): void {
    const ahora = new Date();
    for (const lote of this._lotes) {
      if (
        lote.estado === BatchEstado.DISPONIBLE &&
        lote.expiraEn &&
        lote.expiraEn.value < ahora
      ) {
        const q = lote.remaining;
        lote.marcarExpirado();
        this._transacciones.push(
          new Transaccion(
            generarTxId(),
            lote.id,
            TxTipo.EXPIRACION,
            q,
            new Date(),
          ),
        );
      }
    }
  }
}
