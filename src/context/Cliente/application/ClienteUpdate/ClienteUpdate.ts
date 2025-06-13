import { ClienteNotFoundError } from '../../core/Exceptions/ClienteNotFoundError';
import { ClienteRepository } from '../../core/Repository/ClienteRepository';
import { ClienteApellido } from '../../core/ValueObjects/ClienteApellido';
import { ClienteCategoria } from '../../core/ValueObjects/ClienteCategoria';
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

interface ClienteUpdateInput {
  id: string; // siempre obligatorio
  dni?: string;
  nombre?: string;
  apellido?: string;
  sexo?: string;
  fechaNacimiento?: Date;
  status?: string;
  categoria?: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  codPostal?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  idFidely?: string | null;
  tarjetaFidely?: string | null;
  fechaBaja?: Date | null;
}

export class ClienteUpdate {
  constructor(private readonly repository: ClienteRepository) {}

  async run(input: ClienteUpdateInput): Promise<void> {
    // 1) Recupero el Cliente existente
    const cliente = await this.repository.findById(new ClienteId(input.id));
    if (!cliente) throw new ClienteNotFoundError('Cliente no encontrado');

    // 2) Aplico sólo los campos que vienen
    if (input.dni !== undefined) cliente.editarDni(new ClienteDni(input.dni));
    if (input.nombre !== undefined)
      cliente.editarNombre(new ClienteNombre(input.nombre));
    if (input.apellido !== undefined)
      cliente.editarApellido(new ClienteApellido(input.apellido));
    if (input.sexo !== undefined)
      cliente.editarSexo(new ClienteSexo(input.sexo));
    if (input.fechaNacimiento !== undefined)
      cliente.editarFechaNacimiento(
        new ClienteFechaNacimiento(input.fechaNacimiento),
      );
    if (input.status !== undefined)
      cliente.editarStatus(new ClienteStatus(input.status));

    if (input.categoria !== undefined)
      cliente.editarCategoria(new ClienteCategoria(input.categoria));

    // y lo mismo para los opcionales / nulos
    if (input.email !== undefined)
      cliente.editarEmail(new ClienteEmail(input.email));
    if (input.telefono !== undefined)
      cliente.editarTelefono(new ClienteTelefono(input.telefono));
    if (input.direccion !== undefined)
      cliente.editarDireccion(new ClienteDireccion(input.direccion));
    if (input.codPostal !== undefined)
      cliente.editarCodigoPostal(new ClienteCodigoPostal(input.codPostal));
    if (input.localidad !== undefined)
      cliente.editarLocalidad(new ClienteLocalidad(input.localidad));
    if (input.provincia !== undefined)
      cliente.editarProvincia(new ClienteProvincia(input.provincia));
    if (input.idFidely !== undefined)
      cliente.editarIdFidely(new ClienteIdFidely(input.idFidely));
    if (input.tarjetaFidely !== undefined)
      cliente.editarTarjetaFidely(
        new ClienteTarjetaFidely(input.tarjetaFidely),
      );
    if (input.fechaBaja !== undefined)
      cliente.editarFechaBaja(new ClienteFechaBaja(input.fechaBaja));

    cliente.touch();

    // 3) Persisto
    await this.repository.update(cliente);
  }
}
