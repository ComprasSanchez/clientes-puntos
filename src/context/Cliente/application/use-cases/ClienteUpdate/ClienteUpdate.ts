import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { ClienteNotFoundError } from '@cliente/core/exceptions/ClienteNotFoundError';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
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
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIA_REPO, CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { uniqueCardGenerator } from '@cliente/application/services/CardGenerator';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteIdFidely } from '@cliente/core/value-objects/ClienteIdFidely';

interface ClienteUpdateInput {
  id?: string;
  dni?: string;
  nombre?: string;
  apellido?: string;
  sexo?: string;
  fechaNacimiento?: Date;
  status?: string;
  categoriaId?: string;
  idFidely: number;
  tarjetaFidely?: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  codPostal?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  fechaBaja?: string | null;
}

@Injectable()
export class ClienteUpdate {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
    @Inject(CATEGORIA_REPO)
    private readonly categoriaRepo: CategoriaRepository,
    @Inject(uniqueCardGenerator)
    private readonly cardGen: uniqueCardGenerator,
  ) {}

  async run(
    input: ClienteUpdateInput,
    ctx?: TransactionContext,
  ): Promise<Cliente> {
    // 1) Recupero el Cliente existente
    let cliente: Cliente | null;
    if (input.id) {
      cliente = await this.repository.findById(new ClienteId(input.id));
      if (!cliente || cliente === null)
        throw new ClienteNotFoundError(input.id);
    } else {
      cliente = await this.repository.findByIdFidely(
        new ClienteIdFidely(input.idFidely),
      );
      if (!cliente || cliente === null)
        throw new ClienteNotFoundError(input.dni!);
    }

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

    if (input.categoriaId !== undefined) {
      const catIdVo = new CategoriaId(input.categoriaId);
      const categoria = await this.categoriaRepo.findById(catIdVo);
      if (!categoria) {
        throw new CategoriaNotFoundError(input.categoriaId);
      }

      cliente.cambiarCategoria(categoria);
    }
    if (input.tarjetaFidely !== undefined) {
      const newCard = await this.cardGen.generate();
      cliente.editarTarjetaFidely(new ClienteTarjetaFidely(newCard));
    }
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
    if (input.fechaBaja !== undefined && input.fechaBaja !== null)
      cliente.editarFechaBaja(new ClienteFechaBaja(new Date(input.fechaBaja)));

    cliente.touch();

    // 3) Persisto
    await this.repository.update(cliente, ctx);
    const result = await this.repository.findById(cliente.id);
    if (!result) {
      throw new Error('Cliente no encontrado después de crear');
    }
    return result;
  }
}
