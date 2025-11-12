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

  constructor(private readonly dataSource: DataSource) {
    this.ormRepo = dataSource.getRepository(ClienteEntity);
  }

  async findAll(): Promise<Cliente[]> {
    const entities = await this.ormRepo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async countAll(): Promise<number> {
    return this.ormRepo.count();
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

  async findByIdFidely(idFidely: ClienteIdFidely): Promise<Cliente | null> {
    const entity = await this.ormRepo.findOne({
      where: { idFidely: idFidely.value },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async existsByTarjetaFidely(numero: string): Promise<boolean> {
    const count = await this.ormRepo.count({
      where: { tarjetaFidely: numero },
    });
    return count > 0;
  }

  /**
   * UPSERT por DNI: si no existe -> inserta; si existe -> actualiza campos (sin tocar id/created_at)
   */
  async create(cliente: Cliente): Promise<void> {
    const entity = this.toEntity(cliente);
    await this.insertOnConflictUpdateByDni(entity);
  }

  /**
   * También usamos UPSERT por DNI para que sea idempotente.
   */
  async update(cliente: Cliente): Promise<void> {
    const entity = this.toEntity(cliente);
    await this.insertOnConflictUpdateByDni(entity);
  }

  // ---------- helpers ----------

  /**
   * Implementación de INSERT ... ON CONFLICT ("dni") DO UPDATE SET ...
   * Actualiza columnas de datos y fuerza updated_at = NOW().
   * No modifica id ni created_at.
   */
  private async insertOnConflictUpdateByDni(
    entity: ClienteEntity,
  ): Promise<void> {
    await this.ormRepo
      .createQueryBuilder()
      .insert()
      .into(ClienteEntity)
      .values(entity)
      .onConflict(
        `
        ("dni") DO UPDATE SET
          nombre = EXCLUDED.nombre,
          apellido = EXCLUDED.apellido,
          sexo = EXCLUDED.sexo,
          fec_nacimiento = EXCLUDED.fec_nacimiento,
          status_cliente = EXCLUDED.status_cliente,
          categoria_id = EXCLUDED.categoria_id,
          tarjeta_fidely = EXCLUDED.tarjeta_fidely,
          email = EXCLUDED.email,
          telefono = EXCLUDED.telefono,
          direccion = EXCLUDED.direccion,
          cod_postal = EXCLUDED.cod_postal,
          localidad = EXCLUDED.localidad,
          provincia = EXCLUDED.provincia,
          fecha_baja = EXCLUDED.fecha_baja,
          updated_at = NOW()
      `,
      )
      .execute();
  }

  private toDomain(e: ClienteEntity): Cliente {
    const catDom = new Categoria(
      new CategoriaId(e.categoria.id),
      new CategoriaNombre(e.categoria.nombre),
      e.categoria.codExt,
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
      new ClienteTarjetaFidely(e.tarjetaFidely),
      new ClienteIdFidely(e.idFidely),
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
    e.id = c.id.value; // no se modificará en el ON CONFLICT
    e.dni = c.dni.value;
    e.nombre = c.nombre.value;
    e.apellido = c.apellido.value;
    e.sexo = c.sexo.value;
    e.fecNacimiento = c.fechaNacimiento ? c.fechaNacimiento.value : null;
    e.status = c.status.value;
    e.categoria = { id: c.categoria.id.value } as CategoriaEntity;
    e.tarjetaFidely = c.fidelyStatus.tarjetaFidely.value;
    e.idFidely = c.fidelyStatus.idFidely.value as number | null | undefined;
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
