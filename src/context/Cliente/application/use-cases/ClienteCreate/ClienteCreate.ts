import { Cliente } from '../../../core/Cliente';
import { ClienteRepository } from '../../../core/repository/ClienteRepository';
import { ClienteApellido } from '../../../core/value-objects/ClienteApellido';
import { ClienteCodigoPostal } from '../../../core/value-objects/ClienteCodPostal';
import { ClienteDireccion } from '../../../core/value-objects/ClienteDireccion';
import { ClienteDni } from '../../../core/value-objects/ClienteDni';
import { ClienteEmail } from '../../../core/value-objects/ClienteEmail';
import { ClienteFechaBaja } from '../../../core/value-objects/ClienteFechaBaja';
import { ClienteFechaNacimiento } from '../../../core/value-objects/ClienteFechaNacimiento';
import { ClienteId } from '../../../core/value-objects/ClienteId';
import { ClienteIdFidely } from '../../../core/value-objects/ClienteIdFidely';
import { ClienteLocalidad } from '../../../core/value-objects/ClienteLocalidad';
import { ClienteNombre } from '../../../core/value-objects/ClienteNombre';
import { ClienteProvincia } from '../../../core/value-objects/ClienteProvincia';
import { ClienteSexo } from '../../../core/value-objects/ClienteSexo';
import { ClienteStatus } from '../../../core/value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '../../../core/value-objects/ClienteTarjetaFidely';
import { ClienteTelefono } from '../../../core/value-objects/ClienteTelefono';

export class ClienteCreate {
  constructor(private repository: ClienteRepository) {}

  async run(
    id: string,
    dni: string,
    nombre: string,
    apellido: string,
    sexo: string,
    fechaNacimiento: Date,
    status: string,
    email?: string,
    telefono?: string,
    direccion?: string,
    codPostal?: string,
    localidad?: string,
    provincia?: string,
    idFidely?: string,
    tarjetaFidely?: string,
  ): Promise<void> {
    const cliente = new Cliente(
      new ClienteId(id),
      new ClienteDni(dni),
      new ClienteNombre(nombre),
      new ClienteApellido(apellido),
      new ClienteSexo(sexo),
      new ClienteFechaNacimiento(fechaNacimiento),
      new ClienteStatus(status),
      new ClienteEmail(email || null),
      new ClienteTelefono(telefono || null),
      new ClienteDireccion(direccion || null),
      new ClienteCodigoPostal(codPostal || null),
      new ClienteLocalidad(localidad || null),
      new ClienteProvincia(provincia || null),
      new ClienteIdFidely(idFidely || null),
      new ClienteTarjetaFidely(tarjetaFidely || null),
      new ClienteFechaBaja(null),
    );
    return this.repository.create(cliente);
  }
}
