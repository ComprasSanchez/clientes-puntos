import { Injectable } from '@nestjs/common';
import { ClienteRepository } from 'src/context/Cliente/core/repository/ClienteRepository';
import { ClienteEntity } from '../entities/ClienteEntity';
import { DataSource, Repository } from 'typeorm';
import { Cliente } from 'src/context/Cliente/core/entities/Cliente';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { ClienteDni } from 'src/context/Cliente/core/value-objects/ClienteDni';
import { Categoria } from 'src/context/Cliente/core/entities/Categoria';
import { CategoriaId } from 'src/context/Cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from 'src/context/Cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from 'src/context/Cliente/core/value-objects/CategoriaDescripcion';
import { ClienteNombre } from 'src/context/Cliente/core/value-objects/ClienteNombre';
import { ClienteApellido } from 'src/context/Cliente/core/value-objects/ClienteApellido';
import { ClienteSexo } from 'src/context/Cliente/core/value-objects/ClienteSexo';
import { ClienteFechaNacimiento } from 'src/context/Cliente/core/value-objects/ClienteFechaNacimiento';
import { ClienteStatus } from 'src/context/Cliente/core/value-objects/ClienteStatus';
import { ClienteEmail } from 'src/context/Cliente/core/value-objects/ClienteEmail';
import { ClienteTelefono } from 'src/context/Cliente/core/value-objects/ClienteTelefono';
import { ClienteDireccion } from 'src/context/Cliente/core/value-objects/ClienteDireccion';
import { ClienteCodigoPostal } from 'src/context/Cliente/core/value-objects/ClienteCodPostal';
import { ClienteLocalidad } from 'src/context/Cliente/core/value-objects/ClienteLocalidad';
import { ClienteProvincia } from 'src/context/Cliente/core/value-objects/ClienteProvincia';
import { ClienteIdFidely } from 'src/context/Cliente/core/value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from 'src/context/Cliente/core/value-objects/ClienteTarjetaFidely';
import { ClienteFechaBaja } from 'src/context/Cliente/core/value-objects/ClienteFechaBaja';
import { CategoriaEntity } from '../entities/CategoriaEntity';

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
    e.categoria = { id: c.categoria.id.value } as CategoriaEntity;
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
