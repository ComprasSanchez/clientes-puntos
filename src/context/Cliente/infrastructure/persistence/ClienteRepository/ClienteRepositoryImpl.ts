import { Injectable } from '@nestjs/common';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { ClienteEntity } from '../../entities/ClienteEntity';
import { DataSource, Repository } from 'typeorm';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';
import { ClienteNombre } from '@cliente/core/value-objects/ClienteNombre';
import { ClienteApellido } from '@cliente/core/value-objects/ClienteApellido';
import { ClienteSexo } from '@cliente/core/value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from '@cliente/core/value-objects/ClienteFechaNacimiento';
import { ClienteStatus } from '@cliente/core/value-objects/ClienteStatus';
import { ClienteEmail } from '@cliente/core/value-objects/ClienteEmail';
import { ClienteTelefono } from '@cliente/core/value-objects/ClienteTelefono';
import { ClienteDireccion } from '@cliente/core/value-objects/ClienteDireccion';
import { ClienteCodigoPostal } from '@cliente/core/value-objects/ClienteCodPostal';
import { ClienteLocalidad } from '@cliente/core/value-objects/ClienteLocalidad';
import { ClienteProvincia } from '@cliente/core/value-objects/ClienteProvincia';
import { ClienteIdFidely } from '@cliente/core/value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { ClienteFechaBaja } from '@cliente/core/value-objects/ClienteFechaBaja';
import { CategoriaEntity } from '../../entities/CategoriaEntity';

@Injectable()
export class TypeOrmClienteRepository implements ClienteRepository {
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

  async findByNroTarjeta(
    nroTarjeta: ClienteTarjetaFidely,
  ): Promise<Cliente | null> {
    const entity = await this.ormRepo.findOne({
      where: { tarjetaFidely: nroTarjeta.value },
    });
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
    const catDom = new Categoria(
      new CategoriaId(e.categoria.id),
      new CategoriaNombre(e.categoria.nombre),
      new CategoriaDescripcion(e.categoria.descripcion),
    );
    return new Cliente(
      new ClienteId(e.id),
      new ClienteDni(e.dni),
      new ClienteNombre(e.nombre),
      new ClienteApellido(e.apellido),
      new ClienteSexo(e.sexo),
      new ClienteFechaNacimiento(e.fecNacimiento),
      new ClienteStatus(e.status),
      catDom,
      new ClienteIdFidely(e.idFidely),
      new ClienteTarjetaFidely(e.tarjetaFidely),
      new ClienteEmail(e.email),
      new ClienteTelefono(e.telefono),
      new ClienteDireccion(e.direccion),
      new ClienteCodigoPostal(e.codPostal),
      new ClienteLocalidad(e.localidad),
      new ClienteProvincia(e.provincia),
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
    e.categoria = { id: c.categoria.id.value } as CategoriaEntity;
    e.idFidely = c.fidelyStatus.idFidely.value;
    e.tarjetaFidely = c.fidelyStatus.tarjetaFidely.value;
    e.email = c.email.value;
    e.telefono = c.telefono.value;
    e.direccion = c.fullAdress.direccion.value;
    e.codPostal = c.fullAdress.codPostal.value;
    e.localidad = c.fullAdress.localidad.value;
    e.provincia = c.fullAdress.provincia.value;
    e.fechaBaja = c.fidelyStatus.fechaBaja.value ?? null;
    return e;
  }
}
