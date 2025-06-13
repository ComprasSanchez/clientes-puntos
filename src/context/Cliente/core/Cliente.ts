import { ClienteApellido } from './ValueObjects/ClienteApellido';
import { ClienteCategoria } from './ValueObjects/ClienteCategoria';
import { ClienteCodigoPostal } from './ValueObjects/ClienteCodPostal';
import { ClienteDireccion } from './ValueObjects/ClienteDireccion';
import { ClienteDni } from './ValueObjects/ClienteDni';
import { ClienteEmail } from './ValueObjects/ClienteEmail';
import { ClienteFechaAlta } from './ValueObjects/ClienteFechaAlta';
import { ClienteFechaBaja } from './ValueObjects/ClienteFechaBaja';
import { ClienteFechaNacimiento } from './ValueObjects/ClienteFechaNacimiento';
import { ClienteId } from './ValueObjects/ClienteId';
import { ClienteIdFidely } from './ValueObjects/ClienteIdFidely';
import { ClienteLocalidad } from './ValueObjects/ClienteLocalidad';
import { ClienteNombre } from './ValueObjects/ClienteNombre';
import { ClienteProvincia } from './ValueObjects/ClienteProvincia';
import { ClienteSexo } from './ValueObjects/ClienteSexo';
import { ClienteStatus } from './ValueObjects/ClienteStatus';
import { ClienteTarjetaFidely } from './ValueObjects/ClienteTarjetaFidely';
import { ClienteTelefono } from './ValueObjects/ClienteTelefono';

/**
 * Representa la entidad de dominio Cliente.
 * Contiene la lógica y validaciones propias del agregado Cliente.
 */
export class Cliente {
  private readonly _id: ClienteId;
  private readonly _dni: ClienteDni;
  private _nombre: ClienteNombre;
  private _apellido: ClienteApellido;
  private _sexo: ClienteSexo;
  private _fechaNacimiento: ClienteFechaNacimiento;
  private _status: ClienteStatus;

  // Se auto-inicializan
  private _categoria: ClienteCategoria;
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

  constructor(
    id: ClienteId,
    dni: ClienteDni,
    nombre: ClienteNombre,
    apellido: ClienteApellido,
    sexo: ClienteSexo,
    fechaNacimiento: ClienteFechaNacimiento,
    status: ClienteStatus,
    email?: ClienteEmail,
    telefono?: ClienteTelefono,
    direccion?: ClienteDireccion,
    codPostal?: ClienteCodigoPostal,
    localidad?: ClienteLocalidad,
    provincia?: ClienteProvincia,
    idFidely?: ClienteIdFidely,
    tarjetaFidely?: ClienteTarjetaFidely,
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

    // Auto-inicializados
    this._categoria = new ClienteCategoria('General');
    this._fechaAlta = new ClienteFechaAlta(new Date());

    // Campos opcionales (nullable VOs)
    this._email = email ?? new ClienteEmail(null);
    this._telefono = telefono ?? new ClienteTelefono(null);
    this._direccion = direccion ?? new ClienteDireccion(null);
    this._codPostal = codPostal ?? new ClienteCodigoPostal(null);
    this._localidad = localidad ?? new ClienteLocalidad(null);
    this._provincia = provincia ?? new ClienteProvincia(null);
    this._idFidely = idFidely ?? new ClienteIdFidely(null);
    this._tarjetaFidely = tarjetaFidely ?? new ClienteTarjetaFidely(null);
    this._fechaBaja = fechaBaja ?? new ClienteFechaBaja(null);
  }
}
