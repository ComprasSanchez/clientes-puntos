import { TxTipo } from '../enums/TxTipo';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { LoteId } from '../value-objects/LoteId';
import { ReferenciaMovimiento } from '../value-objects/ReferenciaMovimiento';
import { TransaccionId } from '../value-objects/TransaccionId';

export class Transaccion {
  private _updatedAt: Date;

  constructor(
    private readonly _id: TransaccionId,
    private readonly _loteId: LoteId,
    private readonly _tipo: TxTipo,
    private readonly _cantidad: CantidadPuntos,
    private readonly _createdAt: Date,
    private readonly _referenciaId?: ReferenciaMovimiento,
  ) {
    this._updatedAt = new Date(_createdAt);
  }

  get id(): TransaccionId {
    return this._id;
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
