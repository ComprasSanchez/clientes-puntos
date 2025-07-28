import { Categoria } from '@cliente/core/entities/Categoria';
import { Cliente } from '@cliente/core/entities/Cliente';
import { StatusCliente } from '@cliente/core/enums/StatusCliente';
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
import { ClienteIdFidely } from '@cliente/core/value-objects/ClienteIdFidely';
import { ClienteLocalidad } from '@cliente/core/value-objects/ClienteLocalidad';
import { ClienteNombre } from '@cliente/core/value-objects/ClienteNombre';
import { ClienteProvincia } from '@cliente/core/value-objects/ClienteProvincia';
import { ClienteSexo } from '@cliente/core/value-objects/ClienteSexo';
import { ClienteStatus } from '@cliente/core/value-objects/ClienteStatus';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { ClienteTelefono } from '@cliente/core/value-objects/ClienteTelefono';
import { Inject, Injectable } from '@nestjs/common';
import { CardGenerator } from '@shared/core/interfaces/CardGenerator';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';

@Injectable()
export class ClienteCreate {
  constructor(
    @Inject(CLIENTE_REPO)
    private repository: ClienteRepository,
    @Inject(CATEGORIA_REPO)
    private categoriaRepository: CategoriaRepository,
    @Inject(UUIDGenerator)
    private readonly idGen: UUIDGenerator,
    @Inject(CardGenerator)
    private readonly cardGen: CardGenerator,
  ) {}

  async run(
    dni: string,
    nombre: string,
    apellido: string,
    sexo: string,
    fechaNacimiento: Date,
    categoria?: Categoria,
    email?: string,
    telefono?: string,
    direccion?: string,
    codPostal?: string,
    localidad?: string,
    provincia?: string,
  ): Promise<void> {
    const newCard = await this.generateUniqueCard();

    if (!categoria) {
      categoria = await this.categoriaRepository.findDefault();
      if (!categoria) {
        throw new Error('No se encontró una categoría por defecto');
      }
    }

    const cliente = new Cliente(
      new ClienteId(this.idGen.generate()),
      new ClienteDni(dni),
      new ClienteNombre(nombre),
      new ClienteApellido(apellido),
      new ClienteSexo(sexo),
      new ClienteFechaNacimiento(fechaNacimiento),
      new ClienteStatus(StatusCliente.Activo),
      categoria,
      new ClienteIdFidely(1), //Crear generador
      new ClienteTarjetaFidely(newCard),
      new ClienteEmail(email || null),
      new ClienteTelefono(telefono || null),
      new ClienteDireccion(direccion || null),
      new ClienteCodigoPostal(codPostal || null),
      new ClienteLocalidad(localidad || null),
      new ClienteProvincia(provincia || null),
      new ClienteFechaBaja(null),
    );
    await this.repository.create(cliente);
  }

  private async generateUniqueCard(): Promise<string> {
    let intentos = 0;
    let cardNumber: string;
    do {
      if (intentos++ > 10) {
        throw new Error('No se pudo generar un número de tarjeta único');
      }
      cardNumber = this.cardGen.generate();
    } while (await this.repository.existsByTarjetaFidely(cardNumber));
    return cardNumber;
  }
}
