import { Categoria } from '@cliente/core/entities/Categoria';
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

    const cliente = ClienteFactory.crear({
      id: new ClienteId(this.idGen.generate()),
      dni: new ClienteDni(dni),
      nombre: new ClienteNombre(nombre),
      apellido: new ClienteApellido(apellido),
      sexo: new ClienteSexo(sexo),
      fechaNacimiento: new ClienteFechaNacimiento(fechaNacimiento),
      status: new ClienteStatus(StatusCliente.Activo),
      categoria,
      tarjetaFidely: new ClienteTarjetaFidely(newCard),
      // idFidely: NO SE PASA (queda undefined)
      email: new ClienteEmail(email || null),
      telefono: new ClienteTelefono(telefono || null),
      direccion: new ClienteDireccion(direccion || null),
      codPostal: new ClienteCodigoPostal(codPostal || null),
      localidad: new ClienteLocalidad(localidad || null),
      provincia: new ClienteProvincia(provincia || null),
      fechaBaja: new ClienteFechaBaja(null),
    });
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
