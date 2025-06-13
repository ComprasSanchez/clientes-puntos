import { Cliente } from '../../core/Cliente';
import { ClienteRepository } from '../../core/Repository/ClienteRepository';
import { ClienteApellido } from '../../core/ValueObjects/ClienteApellido';
import { ClienteCodigoPostal } from '../../core/ValueObjects/ClienteCodPostal';
import { ClienteDireccion } from '../../core/ValueObjects/ClienteDireccion';
import { ClienteDni } from '../../core/ValueObjects/ClienteDni';
import { ClienteEmail } from '../../core/ValueObjects/ClienteEmail';
import { ClienteFechaBaja } from '../../core/ValueObjects/ClienteFechaBaja';
import { ClienteFechaNacimiento } from '../../core/ValueObjects/ClienteFechaNacimiento';
import { ClienteId } from '../../core/ValueObjects/ClienteId';
import { ClienteIdFidely } from '../../core/ValueObjects/ClienteIdFidely';
import { ClienteLocalidad } from '../../core/ValueObjects/ClienteLocalidad';
import { ClienteNombre } from '../../core/ValueObjects/ClienteNombre';
import { ClienteProvincia } from '../../core/ValueObjects/ClienteProvincia';
import { ClienteSexo } from '../../core/ValueObjects/ClienteSexo';
import { ClienteStatus } from '../../core/ValueObjects/ClienteStatus';
import { ClienteTarjetaFidely } from '../../core/ValueObjects/ClienteTarjetaFidely';
import { ClienteTelefono } from '../../core/ValueObjects/ClienteTelefono';

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
