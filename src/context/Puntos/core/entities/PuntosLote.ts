import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { LoteId } from '../value-objects/LoteId';
import { CantidadPuntos } from '../value-objects/LoteCantidadPuntos';
import { FechaExpiracion } from '../value-objects/LoteFechaExpiracion';
import { OrigenOperacion } from '../value-objects/LoteOrigenOperacion';
import { ReferenciaMovimiento } from '../value-objects/LoteReferenciaMovimiento';
import { BatchEstado } from '../enums/BatchEstado';

export class Lote {
  private _remaining: CantidadPuntos;
  private _estado: BatchEstado;
  private _updatedAt: Date;

  constructor(
    private readonly _id: LoteId,
    private readonly _clienteId: ClienteId,
    private readonly _cantidadOriginal: CantidadPuntos,
    remaining: CantidadPuntos,
    estado: BatchEstado,
    private readonly _createdAt: Date,
    private readonly _expiraEn: FechaExpiracion | null,
    private readonly _origenTipo: OrigenOperacion,
    private readonly _referenciaId?: ReferenciaMovimiento,
  ) {
    this._remaining = remaining;
    this._estado = estado;
    this._updatedAt = new Date();
  }

  get id(): LoteId {
    return this._id;
  }

  get clienteId(): ClienteId {
    return this._clienteId;
  }

  get cantidadOriginal(): CantidadPuntos {
    return this._cantidadOriginal;
  }

  get remaining(): CantidadPuntos {
    return this._remaining;
  }

  get estado(): BatchEstado {
    return this._estado;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get expiraEn(): FechaExpiracion | null {
    return this._expiraEn;
  }

  get origenTipo(): OrigenOperacion {
    return this._origenTipo;
  }

  get referenciaId(): ReferenciaMovimiento | undefined {
    return this._referenciaId;
  }

  consumir(cantidad: CantidadPuntos): void {
    if (this._estado !== BatchEstado.DISPONIBLE) {
      throw new Error(`Lote ${this._id.value} no disponible`);
    }
    if (cantidad.value > this._remaining.value) {
      throw new Error(
        `No quedan ${cantidad.value} pts en lote ${this._id.value}`,
      );
    }
    this._remaining = new CantidadPuntos(
      this._remaining.value - cantidad.value,
    );
    this._updatedAt = new Date();
  }

  revertir(cantidad: CantidadPuntos): void {
    this._remaining = new CantidadPuntos(
      this._remaining.value + cantidad.value,
    );
    this._updatedAt = new Date();
  }

  marcarDisponible(): void {
    this._estado = BatchEstado.DISPONIBLE;
    this._updatedAt = new Date();
  }

  marcarExpirado(): void {
    this._estado = BatchEstado.EXPIRADO;
    this._remaining = new CantidadPuntos(0);
    this._updatedAt = new Date();
  }
}
