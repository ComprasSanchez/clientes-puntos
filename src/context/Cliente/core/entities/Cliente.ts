import { StatusCliente } from '../enums/StatusCliente';
import { ClienteFechaAlta } from '../value-objects/ClienteFechaAlta';
import { ClienteFechaBaja } from '../value-objects/ClienteFechaBaja';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteId } from '../value-objects/ClienteId';
import { ClienteIdFidely } from '../value-objects/ClienteIdFidely';
import { ClienteStatus } from '../value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '../value-objects/ClienteTarjetaFidely';
import { Categoria } from './Categoria';

export class Cliente {
  private readonly _id: ClienteId;
  private _dni: ClienteDni;
  private _status: ClienteStatus;
  private _categoria: Categoria;
  private readonly _idFidely: ClienteIdFidely;
  private _tarjetaFidely: ClienteTarjetaFidely;
  private _fechaAlta: ClienteFechaAlta;
  private _fechaBaja: ClienteFechaBaja;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    id: ClienteId;
    dni: ClienteDni;
    status: ClienteStatus;
    categoria: Categoria;
    tarjetaFidely: ClienteTarjetaFidely;
    idFidely?: ClienteIdFidely;
    fechaAlta?: ClienteFechaAlta;
    fechaBaja?: ClienteFechaBaja;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = params.id;
    this._dni = params.dni;
    this._status = params.status;
    this._categoria = params.categoria;
    this._idFidely = params.idFidely ?? new ClienteIdFidely(undefined);
    this._tarjetaFidely = params.tarjetaFidely;
    this._fechaAlta = params.fechaAlta ?? new ClienteFechaAlta(new Date());
    this._fechaBaja = params.fechaBaja ?? new ClienteFechaBaja(null);
    this._createdAt = params.createdAt ?? new Date();
    this._updatedAt = params.updatedAt ?? new Date();
  }

  get id(): ClienteId {
    return this._id;
  }

  get dni(): ClienteDni {
    return this._dni;
  }

  get status(): ClienteStatus {
    return this._status;
  }

  get categoria(): Categoria {
    return this._categoria;
  }

  get fidelyStatus(): {
    idFidely: ClienteIdFidely;
    tarjetaFidely: ClienteTarjetaFidely;
    categoria: Categoria;
    fechaAlta: ClienteFechaAlta;
    fechaBaja: ClienteFechaBaja;
  } {
    return {
      idFidely: this._idFidely,
      tarjetaFidely: this._tarjetaFidely,
      categoria: this._categoria,
      fechaAlta: this._fechaAlta,
      fechaBaja: this._fechaBaja,
    };
  }

  get timestamp(): { createdAt: Date; updatedAt: Date } {
    return {
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  editarDni(nuevoDni: ClienteDni): void {
    this._dni = nuevoDni;
    this.touch();
  }

  editarStatus(nuevoStatus: ClienteStatus): void {
    this._status = nuevoStatus;
    this.touch();
  }

  cambiarCategoria(nueva: Categoria): void {
    this._categoria = nueva;
    this.touch();
  }

  editarTarjetaFidely(nuevaTarjeta: ClienteTarjetaFidely): void {
    this._tarjetaFidely = nuevaTarjeta;
    this.touch();
  }

  editarFechaBaja(nuevaFechaBaja: ClienteFechaBaja): void {
    this._fechaBaja = nuevaFechaBaja;
    this.touch();
  }

  touch(): void {
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this.editarFechaBaja(new ClienteFechaBaja(new Date()));
    this.editarStatus(new ClienteStatus(StatusCliente.Inactivo));
    this.touch();
  }
}
