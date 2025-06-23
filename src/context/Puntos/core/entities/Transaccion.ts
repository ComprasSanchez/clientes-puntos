import { TxTipo } from '../enums/TxTipo';
import { TransaccionNoPersistidaError } from '../exceptions/Transaccion/TransaccionNoPersistidaError';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { LoteId } from '../value-objects/LoteId';
import { ReferenciaMovimiento } from '../value-objects/ReferenciaMovimiento';
import { TimestampId } from '../value-objects/TimestampId';
import { TransaccionId } from '../value-objects/TransaccionId';

export class Transaccion {
  private _updatedAt: Date;

  constructor(
    private readonly _id: TransaccionId | null,
    private readonly _publicId: TimestampId,
    private readonly _loteId: LoteId,
    private readonly _tipo: TxTipo,
    private readonly _cantidad: CantidadPuntos,
    private readonly _createdAt: Date,
    private readonly _referenciaId?: ReferenciaMovimiento,
  ) {
    this._updatedAt = new Date(_createdAt);
  }

  /**
   * Crea una transacción sin ID; el repositorio le asignará la PK
   */
  static createOrphan(args: {
    publicId: TimestampId;
    loteId: LoteId;
    tipo: TxTipo;
    cantidad: CantidadPuntos;
    createdAt: Date;
    referenciaId?: ReferenciaMovimiento;
  }): Transaccion {
    return new Transaccion(
      null,
      args.publicId,
      args.loteId,
      args.tipo,
      args.cantidad,
      args.createdAt,
      args.referenciaId,
    );
  }

  /**
   * Sólo para reconstrucción desde BD (con ID)
   */
  static rehydrate(args: {
    id: TransaccionId;
    publicId: TimestampId;
    loteId: LoteId;
    tipo: TxTipo;
    cantidad: CantidadPuntos;
    createdAt: Date;
    referenciaId?: ReferenciaMovimiento;
  }): Transaccion {
    return new Transaccion(
      args.id,
      args.publicId,
      args.loteId,
      args.tipo,
      args.cantidad,
      args.createdAt,
      args.referenciaId,
    );
  }

  get id(): TransaccionId {
    if (!this._id) throw new TransaccionNoPersistidaError();
    return this._id;
  }

  get publicId(): TimestampId {
    return this._publicId;
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
}
