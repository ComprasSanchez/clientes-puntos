import { StatusCliente } from '@cliente/core/enums/StatusCliente';
import { ClienteFactory } from '@cliente/core/factories/ClienteFactory';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CATEGORIA_REPO, CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteApellido } from '@cliente/core/value-objects/ClienteApellido';
import { ClienteCodigoPostal } from '@cliente/core/value-objects/ClienteCodPostal';
import { ClienteDireccion } from '@cliente/core/value-objects/ClienteDireccion';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { ClienteEmail } from '@cliente/core/value-objects/ClienteEmail';
import { ClienteFechaBaja } from '@cliente/core/value-objects/ClienteFechaBaja';
import { ClienteFechaNacimiento } from '@cliente/core/value-objects/ClienteFechaNacimiento';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteLocalidad } from '@cliente/core/value-objects/ClienteLocalidad';
import { ClienteNombre } from '@cliente/core/value-objects/ClienteNombre';
import { ClienteProvincia } from '@cliente/core/value-objects/ClienteProvincia';
import { ClienteSexo } from '@cliente/core/value-objects/ClienteSexo';
import { ClienteStatus } from '@cliente/core/value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { ClienteTelefono } from '@cliente/core/value-objects/ClienteTelefono';
import { uniqueCardGenerator } from '@cliente/application/services/CardGenerator';
import { Inject, Injectable } from '@nestjs/common';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { Cliente } from '@cliente/core/entities/Cliente';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { ClienteIdFidely } from '@cliente/core/value-objects/ClienteIdFidely';

export interface ClienteCreateInput {
  dni: string;
  nombre: string;
  apellido: string;
  sexo: string;
  fechaNacimiento: Date;
  categoria?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  codPostal?: string;
  localidad?: string;
  provincia?: string;
  fidely_customerid?: number;
}

@Injectable()
export class ClienteCreate {
  constructor(
    @Inject(CLIENTE_REPO)
    private repository: ClienteRepository,
    @Inject(CATEGORIA_REPO)
    private categoriaRepository: CategoriaRepository,
    @Inject(UUIDGenerator)
    private readonly idGen: UUIDGenerator,
    @Inject(uniqueCardGenerator)
    private readonly cardGen: uniqueCardGenerator,
  ) {}

  async run(
    input: ClienteCreateInput,
    tarjetaConDni: boolean,
    ctx?: TransactionContext,
  ): Promise<Cliente> {
    let newCard: string;
    if (tarjetaConDni) {
      newCard = input.dni;
    } else {
      newCard = await this.cardGen.generate();
    }
    const categoria = await this.categoriaRepository.findDefault();

    if (!categoria) {
      throw new CategoriaNotFoundError(input.categoria || 'default');
    }

    const cliente = ClienteFactory.crear({
      id: new ClienteId(this.idGen.generate()),
      dni: new ClienteDni(input.dni),
      nombre: new ClienteNombre(input.nombre),
      apellido: new ClienteApellido(input.apellido),
      sexo: new ClienteSexo(input.sexo),
      fechaNacimiento: new ClienteFechaNacimiento(input.fechaNacimiento),
      status: new ClienteStatus(StatusCliente.Activo),
      categoria: categoria,
      tarjetaFidely: new ClienteTarjetaFidely(newCard),
      idFidely: new ClienteIdFidely(input.fidely_customerid || null),
      email: new ClienteEmail(input.email || null),
      telefono: new ClienteTelefono(input.telefono || null),
      direccion: new ClienteDireccion(input.direccion || null),
      codPostal: new ClienteCodigoPostal(input.codPostal || null),
      localidad: new ClienteLocalidad(input.localidad || null),
      provincia: new ClienteProvincia(input.provincia || null),
      fechaBaja: new ClienteFechaBaja(null),
    });
    await this.repository.create(cliente, ctx);
    const result = await this.repository.findById(cliente.id);
    if (!result) {
      throw new Error('Cliente no encontrado después de crear');
    }
    return result;
  }
}
