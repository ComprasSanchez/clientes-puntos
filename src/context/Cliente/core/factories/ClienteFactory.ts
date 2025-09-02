// @cliente/core/factories/ClienteFactory.ts

import { Cliente } from '../entities/Cliente';
import { Categoria } from '../entities/Categoria';
import { ClienteId } from '../value-objects/ClienteId';
import { ClienteDni } from '../value-objects/ClienteDni';
import { ClienteNombre } from '../value-objects/ClienteNombre';
import { ClienteApellido } from '../value-objects/ClienteApellido';
import { ClienteSexo } from '../value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from '../value-objects/ClienteFechaNacimiento';
import { ClienteStatus } from '../value-objects/ClienteStatus';
import { ClienteIdFidely } from '../value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from '../value-objects/ClienteTarjetaFidely';
import { ClienteEmail } from '../value-objects/ClienteEmail';
import { ClienteTelefono } from '../value-objects/ClienteTelefono';
import { ClienteDireccion } from '../value-objects/ClienteDireccion';
import { ClienteCodigoPostal } from '../value-objects/ClienteCodPostal';
import { ClienteLocalidad } from '../value-objects/ClienteLocalidad';
import { ClienteProvincia } from '../value-objects/ClienteProvincia';
import { ClienteFechaBaja } from '../value-objects/ClienteFechaBaja';
import { safeCreate } from '@shared/core/utils/safeCreate';

export interface CrearClienteProps {
  id: ClienteId;
  dni: ClienteDni;
  nombre: ClienteNombre;
  apellido: ClienteApellido;
  sexo: ClienteSexo;
  fechaNacimiento: ClienteFechaNacimiento;
  status: ClienteStatus;
  categoria: Categoria;
  tarjetaFidely: ClienteTarjetaFidely;
  idFidely?: ClienteIdFidely;
  email?: ClienteEmail;
  telefono?: ClienteTelefono;
  direccion?: ClienteDireccion;
  codPostal?: ClienteCodigoPostal;
  localidad?: ClienteLocalidad;
  provincia?: ClienteProvincia;
  fechaBaja?: ClienteFechaBaja;
}

export class ClienteFactory {
  static crear(props: CrearClienteProps): Cliente {
    const email = props.email
      ? safeCreate(() => new ClienteEmail(props.email?.value))
      : undefined;

    const telefono = props.telefono
      ? safeCreate(() => new ClienteTelefono(props.telefono?.value))
      : undefined;

    const direccion = props.direccion
      ? safeCreate(() => new ClienteDireccion(props.direccion?.value))
      : undefined;

    const codPostal = props.codPostal
      ? safeCreate(() => new ClienteCodigoPostal(props.codPostal?.value))
      : undefined;

    const localidad = props.localidad
      ? safeCreate(() => new ClienteLocalidad(props.localidad?.value))
      : undefined;

    const provincia = props.provincia
      ? safeCreate(() => new ClienteProvincia(props.provincia?.value))
      : undefined;

    return new Cliente(
      props.id,
      props.dni,
      props.nombre,
      props.apellido,
      props.sexo,
      props.fechaNacimiento,
      props.status,
      props.categoria,
      props.tarjetaFidely,
      props.idFidely,
      email,
      telefono,
      direccion,
      codPostal,
      localidad,
      provincia,
      props.fechaBaja,
    );
  }
}
