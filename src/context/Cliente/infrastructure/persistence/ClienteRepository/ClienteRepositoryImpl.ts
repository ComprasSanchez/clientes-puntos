import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { ClienteEntity } from '../../entities/ClienteEntity';
import { Cliente } from '@cliente/core/entities/Cliente';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { ClienteDni } from '@cliente/core/value-objects/ClienteDni';
import { ClienteIdFidely } from '@cliente/core/value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from '@cliente/core/value-objects/ClienteTarjetaFidely';
import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';
import { ClienteStatus } from '@cliente/core/value-objects/ClienteStatus';
import { ClienteFechaAlta } from '@cliente/core/value-objects/ClienteFechaAlta';
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

  async create(cliente: Cliente): Promise<void> {
    const entity = this.toEntity(cliente);
    await this.insertOnConflictUpdateByDni(entity);
  }

  async update(cliente: Cliente): Promise<void> {
    const entity = this.toEntity(cliente);
    await this.insertOnConflictUpdateByDni(entity);
  }

  async findPagedByIdAsc(params: {
    lastId?: ClienteId | null;
    limit: number;
  }): Promise<Cliente[]> {
    const qb = this.ormRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.categoria', 'categoria')
      .orderBy('c.id', 'ASC')
      .take(params.limit);

    if (params.lastId) {
      qb.where('c.id > :lastId', { lastId: params.lastId.value });
    }

    const rows = await qb.getMany();
    return rows.map((row) => this.toDomain(row));
  }

  async findUpdatedBetween(params: {
    from: Date;
    to: Date;
  }): Promise<Cliente[]> {
    const rows = await this.ormRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.categoria', 'categoria')
      .where('c.updatedAt >= :from', { from: params.from })
      .andWhere('c.updatedAt <= :to', { to: params.to })
      .orderBy('c.updatedAt', 'ASC')
      .addOrderBy('c.id', 'ASC')
      .getMany();

    return rows.map((row) => this.toDomain(row));
  }

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
          status_cliente = EXCLUDED.status_cliente,
          categoria_id = EXCLUDED.categoria_id,
          tarjeta_fidely = EXCLUDED.tarjeta_fidely,
          id_fidely = COALESCE(EXCLUDED.id_fidely, cliente.id_fidely),
          fecha_alta = EXCLUDED.fecha_alta,
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

    return new Cliente({
      id: new ClienteId(e.id),
      dni: new ClienteDni(e.dni),
      status: new ClienteStatus(e.status),
      categoria: catDom,
      tarjetaFidely: new ClienteTarjetaFidely(e.tarjetaFidely),
      idFidely: new ClienteIdFidely(e.idFidely),
      fechaAlta: new ClienteFechaAlta(e.fechaAlta ?? e.createdAt),
      fechaBaja: e.fechaBaja ? new ClienteFechaBaja(e.fechaBaja) : undefined,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    });
  }

  private toEntity(c: Cliente): ClienteEntity {
    const e = new ClienteEntity();
    e.id = c.id.value;
    e.dni = c.dni.value;
    e.status = c.status.value;
    e.categoria = { id: c.categoria.id.value } as CategoriaEntity;
    e.tarjetaFidely = c.fidelyStatus.tarjetaFidely.value;
    e.idFidely = c.fidelyStatus.idFidely.value ?? undefined;
    e.fechaAlta = c.fidelyStatus.fechaAlta.value;
    e.fechaBaja = c.fidelyStatus.fechaBaja.value ?? null;
    return e;
  }
}
