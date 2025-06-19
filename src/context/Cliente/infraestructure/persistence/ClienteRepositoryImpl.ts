// src/context/cliente/infrastructure/persistence/ClienteRepositoryImpl.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClienteRepository } from '../../core/repository/ClienteRepository';
import { Cliente } from '../../core/entities/Cliente';
import { ClienteId } from '../../core/value-objects/ClienteId';
import { ClienteDni } from '../../core/value-objects/ClienteDni';
import { ClienteNombre } from '../../core/value-objects/ClienteNombre';
import { ClienteApellido } from '../../core/value-objects/ClienteApellido';
import { ClienteSexo } from '../../core/value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from '../../core/value-objects/ClienteFechaNacimiento';
import { ClienteStatus } from '../../core/value-objects/ClienteStatus';
import { Categoria } from '../../core/entities/Categoria';
import { ClienteEmail } from '../../core/value-objects/ClienteEmail';
import { ClienteTelefono } from '../../core/value-objects/ClienteTelefono';
import { ClienteDireccion } from '../../core/value-objects/ClienteDireccion';
import { ClienteCodigoPostal } from '../../core/value-objects/ClienteCodPostal';
import { ClienteLocalidad } from '../../core/value-objects/ClienteLocalidad';
import { ClienteProvincia } from '../../core/value-objects/ClienteProvincia';
import { ClienteIdFidely } from '../../core/value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from '../../core/value-objects/ClienteTarjetaFidely';
import { ClienteFechaBaja } from '../../core/value-objects/ClienteFechaBaja';
import { ClienteEntity } from './entities/ClienteEntity';

@Injectable()
export class ClienteRepositoryImpl implements ClienteRepository {
  private readonly ormRepo: Repository<ClienteEntity>;

  constructor(dataSource: DataSource) {
    this.ormRepo = dataSource.getRepository(ClienteEntity);
  }

  async findAll(): Promise<Cliente[]> {
    const entities = await this.ormRepo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: ClienteId): Promise<Cliente | null> {
    const entity = await this.ormRepo.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByDni(dni: ClienteDni): Promise<Cliente | null> {
    const entity = await this.ormRepo.findOne({ where: { dni: dni.value } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(cliente: Cliente): Promise<void> {
    const entity = this.toEntity(cliente);
    await this.ormRepo.insert(entity);
  }

  async update(cliente: Cliente): Promise<void> {
    const entity = this.toEntity(cliente);
    await this.ormRepo.save(entity);
  }

  private toDomain(e: ClienteEntity): Cliente {
    return new Cliente(
      new ClienteId(e.id),
      new ClienteDni(e.dni),
      new ClienteNombre(e.nombre),
      new ClienteApellido(e.apellido),
      new ClienteSexo(e.sexo),
      new ClienteFechaNacimiento(e.fecNacimiento),
      new ClienteStatus(e.status),
      new Categoria(e.categoria),
      new ClienteEmail(e.email),
      new ClienteTelefono(e.telefono),
      new ClienteDireccion(e.direccion),
      new ClienteCodigoPostal(e.codPostal),
      new ClienteLocalidad(e.localidad),
      new ClienteProvincia(e.provincia),
      new ClienteIdFidely(e.idFidely),
      new ClienteTarjetaFidely(e.tarjetaFidely),
      e.fechaBaja ? new ClienteFechaBaja(e.fechaBaja) : undefined,
    );
  }

  private toEntity(c: Cliente): ClienteEntity {
    const e = new ClienteEntity();
    e.id = c.id.value;
    e.dni = c.dni.value;
    e.nombre = c.nombre.value;
    e.apellido = c.apellido.value;
    e.sexo = c.sexo.value;
    e.fecNacimiento = c.fechaNacimiento.value;
    e.status = c.status.value;
    e.categoria = c.categoria.value;
    e.email = c.email.value;
    e.telefono = c.telefono.value;
    e.direccion = c.fullAdress.direccion.value;
    e.codPostal = c.fullAdress.codPostal.value;
    e.localidad = c.fullAdress.localidad.value;
    e.provincia = c.fullAdress.provincia.value;
    e.idFidely = c.fidelyStatus.idFidely.value;
    e.tarjetaFidely = c.fidelyStatus.tarjetaFidely.value;
    e.fechaBaja = c.fidelyStatus.fechaBaja.value ?? null;
    return e;
  }
}
