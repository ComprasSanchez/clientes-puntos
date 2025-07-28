import { ClienteApellido } from '../value-objects/ClienteApellido';
import { Categoria } from './Categoria';
import { ClienteCodigoPostal } from '../value-objects/ClienteCodPostal';
import { ClienteDireccion } from '../value-objects/ClienteDireccion';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteEmail } from '../value-objects/ClienteEmail';
import { ClienteFechaAlta } from '../value-objects/ClienteFechaAlta';
import { ClienteFechaBaja } from '../value-objects/ClienteFechaBaja';
import { ClienteFechaNacimiento } from '../value-objects/ClienteFechaNacimiento';
import { ClienteId } from '../value-objects/ClienteId';
import { ClienteIdFidely } from '../value-objects/ClienteIdFidely';
import { ClienteLocalidad } from '../value-objects/ClienteLocalidad';
import { ClienteNombre } from '../value-objects/ClienteNombre';
import { ClienteProvincia } from '../value-objects/ClienteProvincia';
import { ClienteSexo } from '../value-objects/ClienteSexo';
import { ClienteStatus } from '../value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '../value-objects/ClienteTarjetaFidely';
import { ClienteTelefono } from '../value-objects/ClienteTelefono';
import { StatusCliente } from '../enums/StatusCliente';

/**
 * Representa la entidad de dominio Cliente.
 * Contiene la lógica y validaciones propias del agregado Cliente.
 */
export class Cliente {
  private readonly _id: ClienteId;
  private _dni: ClienteDni;
  private _nombre: ClienteNombre;
  private _apellido: ClienteApellido;
  private _sexo: ClienteSexo;
  private _fechaNacimiento: ClienteFechaNacimiento;
  private _status: ClienteStatus;

  // Se auto-inicializan
  private _categoria: Categoria;
  private _fechaAlta: ClienteFechaAlta;

  // Opcionales (nulos por defecto)
  private _email: ClienteEmail;
  private _telefono: ClienteTelefono;
  private _direccion: ClienteDireccion;
  private _codPostal: ClienteCodigoPostal;
  private _localidad: ClienteLocalidad;
  private _provincia: ClienteProvincia;
  private _idFidely: ClienteIdFidely;
  private _tarjetaFidely: ClienteTarjetaFidely;
  private _fechaBaja: ClienteFechaBaja;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: ClienteId,
    dni: ClienteDni,
    nombre: ClienteNombre,
    apellido: ClienteApellido,
    sexo: ClienteSexo,
    fechaNacimiento: ClienteFechaNacimiento,
    status: ClienteStatus,
    categoria: Categoria,
    idFidely: ClienteIdFidely,
    tarjetaFidely: ClienteTarjetaFidely,
    email?: ClienteEmail,
    telefono?: ClienteTelefono,
    direccion?: ClienteDireccion,
    codPostal?: ClienteCodigoPostal,
    localidad?: ClienteLocalidad,
    provincia?: ClienteProvincia,
    fechaBaja?: ClienteFechaBaja,
  ) {
    // Campos obligatorios
    this._id = id;
    this._dni = dni;
    this._nombre = nombre;
    this._apellido = apellido;
    this._sexo = sexo;
    this._fechaNacimiento = fechaNacimiento;
    this._status = status;
    this._idFidely = idFidely;
    this._tarjetaFidely = tarjetaFidely;

    // Auto-inicializados
    this._categoria = categoria;
    this._fechaAlta = new ClienteFechaAlta(new Date());
    this._createdAt = new Date();
    this._updatedAt = new Date();

    // Campos opcionales (nullable VOs)
    this._email = email ?? new ClienteEmail(null);
    this._telefono = telefono ?? new ClienteTelefono(null);
    this._direccion = direccion ?? new ClienteDireccion(null);
    this._codPostal = codPostal ?? new ClienteCodigoPostal(null);
    this._localidad = localidad ?? new ClienteLocalidad(null);
    this._provincia = provincia ?? new ClienteProvincia(null);
    this._fechaBaja = fechaBaja ?? new ClienteFechaBaja(null);
  }

  get id(): ClienteId {
    return this._id;
  }

  /** Retorna el VO ClienteDni */
  get dni(): ClienteDni {
    return this._dni;
  }

  /** Retorna el VO ClienteNombre */
  get nombre(): ClienteNombre {
    return this._nombre;
  }

  /** Retorna el VO ClienteApellido */
  get apellido(): ClienteApellido {
    return this._apellido;
  }

  /** Retorna el VO ClienteSexo */
  get sexo(): ClienteSexo {
    return this._sexo;
  }

  /** Retorna el VO ClienteFechaNacimiento */
  get fechaNacimiento(): ClienteFechaNacimiento {
    return this._fechaNacimiento;
  }

  /** Retorna el VO ClienteStatus */
  get status(): ClienteStatus {
    return this._status;
  }

  /** Retorna el VO ClienteEmail (nullable) */
  get email(): ClienteEmail {
    return this._email;
  }

  /** Retorna el VO ClienteTelefono (nullable) */
  get telefono(): ClienteTelefono {
    return this._telefono;
  }

  get categoria(): Categoria {
    return this._categoria;
  }

  get fullAdress(): {
    direccion: ClienteDireccion;
    codPostal: ClienteCodigoPostal;
    localidad: ClienteLocalidad;
    provincia: ClienteProvincia;
  } {
    return {
      direccion: this._direccion,
      codPostal: this._codPostal,
      localidad: this._localidad,
      provincia: this._provincia,
    };
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

  editarNombre(nuevoNombre: ClienteNombre): void {
    this._nombre = nuevoNombre;
    this.touch();
  }

  editarApellido(nuevoApellido: ClienteApellido): void {
    this._apellido = nuevoApellido;
    this.touch();
  }

  editarSexo(nuevoSexo: ClienteSexo): void {
    this._sexo = nuevoSexo;
    this.touch();
  }

  editarFechaNacimiento(nuevaFecha: ClienteFechaNacimiento): void {
    this._fechaNacimiento = nuevaFecha;
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

  // Campos opcionales / nulos
  editarEmail(nuevoEmail: ClienteEmail): void {
    this._email = nuevoEmail;
    this.touch();
  }

  editarTelefono(nuevoTelefono: ClienteTelefono): void {
    this._telefono = nuevoTelefono;
    this.touch();
  }

  editarDireccion(nuevaDireccion: ClienteDireccion): void {
    this._direccion = nuevaDireccion;
    this.touch();
  }

  editarCodigoPostal(nuevoCodPostal: ClienteCodigoPostal): void {
    this._codPostal = nuevoCodPostal;
    this.touch();
  }

  editarLocalidad(nuevaLocalidad: ClienteLocalidad): void {
    this._localidad = nuevaLocalidad;
    this.touch();
  }

  editarProvincia(nuevaProvincia: ClienteProvincia): void {
    this._provincia = nuevaProvincia;
    this.touch();
  }

  editarIdFidely(nuevoIdFidely: ClienteIdFidely): void {
    this._idFidely = nuevoIdFidely;
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
