import { StatusCliente } from '@cliente/core/enums/StatusCliente';
import { ClienteFactory } from '@cliente/core/factories/ClienteFactory';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CATEGORIA_REPO, CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { uniqueCardGenerator } from '@cliente/application/services/CardGenerator';
import { Inject, Injectable } from '@nestjs/common';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { Cliente } from '@cliente/core/entities/Cliente';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';

export interface ClienteCreateInput {
  dni: string;
  nombre: string;
  apellido: string;
  sexo: string;
  fechaNacimiento: Date | null;
  categoria?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  codPostal?: string;
  localidad?: string;
  provincia?: string;
  fidely_customerid?: number;
  tarjetaFidely?: string;
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
    // 1) Resolución de tarjeta:
    // - Si tarjetaConDni => es el DNI
    // - Si viene una tarjeta explícita no vacía => usarla
    // - Si no => generar una nueva
    let newCard: string;
    if (tarjetaConDni) {
      newCard = input.dni;
    } else if (
      typeof input.tarjetaFidely === 'string' &&
      input.tarjetaFidely.trim() !== ''
    ) {
      newCard = input.tarjetaFidely.trim();
    } else {
      newCard = await this.cardGen.generate();
    }
    const categoria = await this.categoriaRepository.findDefault();

    if (!categoria) {
      throw new CategoriaNotFoundError(input.categoria || 'default');
    }

    const cliente = ClienteFactory.crear({
      id: this.idGen.generate(),
      dni: input.dni,
      nombre: input.nombre,
      apellido: input.apellido,
      sexo: input.sexo,
      fechaNacimiento: input.fechaNacimiento,
      status: StatusCliente.Activo,
      categoria: categoria,
      tarjetaFidely: newCard, // pasás el string o null
      idFidely: input.fidely_customerid,
      email: input.email,
      telefono: input.telefono,
      direccion: input.direccion,
      codPostal: input.codPostal,
      localidad: input.localidad,
      provincia: input.provincia,
    });
    await this.repository.create(cliente, ctx);
    const result = await this.repository.findByDni(cliente.dni);
    if (!result) {
      throw new Error('Cliente no encontrado después de crear');
    }
    return result;
  }
}
