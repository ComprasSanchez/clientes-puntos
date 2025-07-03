import { TxTipo } from '../enums/TxTipo';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { LoteId } from '../value-objects/LoteId';
import { ReferenciaMovimiento } from '../value-objects/ReferenciaMovimiento';
import { TransaccionId } from '../value-objects/TransaccionId';
import { OperacionId } from '../value-objects/OperacionId';

export class Transaccion {
  private _updatedAt: Date;

  constructor(
    private readonly _id: TransaccionId,
    private readonly _operationId: OperacionId,
    private readonly _loteId: LoteId,
    private readonly _tipo: TxTipo,
    private readonly _cantidad: CantidadPuntos,
    private readonly _createdAt: Date,
    private readonly _reglasAplicadas: Record<
      string,
      Array<{ id: string; nombre: string }>
    >,
    private readonly _referenciaId?: ReferenciaMovimiento,
  ) {
    this._updatedAt = new Date(_createdAt);
  }

  /**
   * Crea una transacción
   */
  static createOrphan(args: {
    id: TransaccionId;
    operationId: OperacionId;
    loteId: LoteId;
    tipo: TxTipo;
    cantidad: CantidadPuntos;
    createdAt: Date;
    reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
    referenciaId?: ReferenciaMovimiento;
  }): Transaccion {
    return new Transaccion(
      args.id,
      args.operationId,
      args.loteId,
      args.tipo,
      args.cantidad,
      args.createdAt,
      args.reglasAplicadas,
      args.referenciaId,
    );
  }

  get id(): TransaccionId {
    return this._id;
  }

  get operationId(): OperacionId {
    return this._operationId;
  }

  get loteId(): LoteId {
    return this._loteId;
  }

  get tipo(): TxTipo {
    return this._tipo;
  }

  get cantidad(): CantidadPuntos {
    return this._cantidad;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get referenciaId(): ReferenciaMovimiento | undefined {
    return this._referenciaId;
  }

  get reglasAplicadas(): Record<string, Array<{ id: string; nombre: string }>> {
    return this._reglasAplicadas;
  }
}
