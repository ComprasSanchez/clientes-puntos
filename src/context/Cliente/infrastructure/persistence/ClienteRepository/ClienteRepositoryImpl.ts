import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
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

/** Lock de Postgres para que una sola réplica libere novedades a la vez. */
const NOVEDADES_PLEX_LOCK_KEY = 7243001;

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

  async findByDNICandidates(candidates: string[]): Promise<Cliente | null> {
    if (candidates.length === 0) {
      return null;
    }

    // Buscar con todos los candidatos (carga relación eager de categoría)
    const entity = await this.ormRepo.findOne({
      where: { dni: In(candidates) },
    });

    if (entity) {
      return this.toDomain(entity);
    }

    // Fallback: buscar con LIKE para handlear padding (ej: 0040772342)
    for (const dni of candidates) {
      const exactMatch = await this.ormRepo.findOne({
        where: { dni: dni },
      });
      if (exactMatch) {
        return this.toDomain(exactMatch);
      }
    }

    return null;
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

  async findNovedadesPlexParaEntregar(params: {
    consumidor: string;
    from: Date;
    to: Date;
    limite: number;
  }): Promise<{
    clientes: Cliente[];
    ultimoClienteId: string | null;
    hayMas: boolean;
  }> {
    // La marca se lee como texto para no perder los microsegundos de
    // novedad_plex_at (un lote liberado comparte el mismo NOW()).
    const marcas: Array<{ hasta: string; cliente_id: string }> =
      await this.dataSource.query(
        `SELECT entregado_hasta::text AS hasta, entregado_hasta_cliente_id::text AS cliente_id
           FROM novedades_plex_entrega
          WHERE consumidor = $1`,
        [params.consumidor],
      );
    const marca = marcas[0];

    const qb = this.ormRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.categoria', 'categoria')
      .where('c.novedadPlexAt <= :to', { to: params.to });

    if (marca) {
      // Con marca manda la marca, no la FechaDesde de Plex: así nada que no
      // se le haya entregado queda afuera aunque Plex ya haya avanzado su
      // fecha (relojes distintos, respuestas anteriores cortadas, etc.).
      qb.andWhere('c.novedadPlexAt >= CAST(:marcaHasta AS timestamptz)', {
        marcaHasta: marca.hasta,
      }).andWhere(
        '(c.novedadPlexAt, c.id) > (CAST(:marcaHasta AS timestamptz), CAST(:marcaId AS uuid))',
        { marcaHasta: marca.hasta, marcaId: marca.cliente_id },
      );
    } else {
      qb.andWhere('c.novedadPlexAt >= :from', { from: params.from });
    }

    // Uno de más para saber si quedó algo afuera por el tope.
    // limit (no take): categoria es ManyToOne, una fila por cliente.
    const rows = await qb
      .orderBy('c.novedadPlexAt', 'ASC')
      .addOrderBy('c.id', 'ASC')
      .limit(params.limite + 1)
      .getMany();

    const hayMas = rows.length > params.limite;
    const tanda = hayMas ? rows.slice(0, params.limite) : rows;

    return {
      clientes: tanda.map((row) => this.toDomain(row)),
      ultimoClienteId: tanda.length ? tanda[tanda.length - 1].id : null,
      hayMas,
    };
  }

  async marcarNovedadesPlexEntregadas(
    consumidor: string,
    ultimoClienteId: string,
  ): Promise<void> {
    // Copia novedad_plex_at desde la base (precisión completa) y solo avanza.
    await this.dataSource.query(
      `INSERT INTO novedades_plex_entrega
              (consumidor, entregado_hasta, entregado_hasta_cliente_id, actualizado_en)
       SELECT $1, c.novedad_plex_at, c.id, NOW()
         FROM cliente c
        WHERE c.id = $2::uuid AND c.novedad_plex_at IS NOT NULL
       ON CONFLICT (consumidor) DO UPDATE
          SET entregado_hasta = EXCLUDED.entregado_hasta,
              entregado_hasta_cliente_id = EXCLUDED.entregado_hasta_cliente_id,
              actualizado_en = NOW()
        WHERE (EXCLUDED.entregado_hasta, EXCLUDED.entregado_hasta_cliente_id)
            > (novedades_plex_entrega.entregado_hasta,
               novedades_plex_entrega.entregado_hasta_cliente_id)`,
      [consumidor, ultimoClienteId],
    );
  }

  async liberarNovedadesPlex(
    limite: number,
    maxSinEntregar: number,
  ): Promise<{ liberados: number; sinEntregar: number }> {
    return this.dataSource.transaction(async (m) => {
      // Una réplica a la vez: si las dos contaran y liberaran juntas, se
      // pasarían del máximo sin entregar.
      const lock: Array<{ ok: boolean }> = await m.query(
        `SELECT pg_try_advisory_xact_lock($1) AS ok`,
        [NOVEDADES_PLEX_LOCK_KEY],
      );
      if (!lock[0]?.ok) return { liberados: 0, sinEntregar: -1 };

      // Publicados que el consumidor más atrasado todavía no recibió.
      // Sin consumidores registrados no hay a quién esperar.
      const pendientes: Array<{ sin_entregar: string | null }> = await m.query(
        `SELECT (
           SELECT count(*)
             FROM cliente c
            WHERE c.novedad_plex_at >= e.entregado_hasta
              AND (c.novedad_plex_at, c.id) > (e.entregado_hasta, e.entregado_hasta_cliente_id)
         ) AS sin_entregar
           FROM novedades_plex_entrega e
          ORDER BY e.entregado_hasta ASC, e.entregado_hasta_cliente_id ASC
          LIMIT 1`,
      );
      const sinEntregar = Number(pendientes[0]?.sin_entregar ?? 0);
      const cupo = Math.min(limite, maxSinEntregar - sinEntregar);
      if (cupo <= 0) return { liberados: 0, sinEntregar };

      const rows = (await m.query(
        `UPDATE cliente
         SET novedad_plex_at = NOW(),
             novedad_plex_pendiente_desde = NULL
         WHERE id IN (
           SELECT id FROM cliente
           WHERE novedad_plex_pendiente_desde IS NOT NULL
           ORDER BY novedad_plex_pendiente_desde ASC, id ASC
           LIMIT $1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING id`,
        [cupo],
      )) as unknown;

      // pg devuelve [filas, cantidad] en UPDATE ... RETURNING vía TypeORM.
      const liberados =
        Array.isArray(rows) && Array.isArray(rows[0])
          ? (rows[0] as unknown[]).length
          : Array.isArray(rows)
            ? rows.length
            : 0;
      return { liberados, sinEntregar };
    });
  }

  async touchByDni(dni: string): Promise<void> {
    const normalized = dni.replace(/^0+/, '');
    await this.dataSource.query(
      `UPDATE cliente
       SET updated_at = NOW(),
           novedad_plex_pendiente_desde = COALESCE(novedad_plex_pendiente_desde, NOW())
       WHERE REGEXP_REPLACE(dni, '^0+', '') = $1`,
      [normalized],
    );
  }
  private async insertOnConflictUpdateByDni(
    entity: ClienteEntity,
  ): Promise<void> {
    const hasExplicitIdFidely =
      entity.idFidely !== undefined && entity.idFidely !== null;

    const idFidelyVal =
      entity.idFidely !== undefined && entity.idFidely !== null
        ? entity.idFidely
        : "nextval('cliente_id_fidely_seq_nuevo_sistema')";

    const idFidelyPlaceholder =
      typeof idFidelyVal === 'string' ? idFidelyVal : '$6';
    const nextPlaceholderIndex = typeof idFidelyVal === 'number' ? 7 : 6;

    const sql = `
      INSERT INTO "cliente" (
        "id", "dni", "status_cliente", "categoria_id", "tarjeta_fidely", "id_fidely", "fecha_alta", "fecha_baja", "created_at", "updated_at", "novedad_plex_pendiente_desde"
      ) VALUES (
        $1, $2, $3, $4, $5, ${idFidelyPlaceholder}, $${nextPlaceholderIndex}, $${nextPlaceholderIndex + 1}, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("dni") DO UPDATE SET
        "status_cliente" = EXCLUDED."status_cliente",
        "categoria_id" = EXCLUDED."categoria_id",
        "tarjeta_fidely" = EXCLUDED."tarjeta_fidely",
        "id_fidely" = CASE
          WHEN $${nextPlaceholderIndex + 2} THEN EXCLUDED."id_fidely"
          ELSE "cliente"."id_fidely"
        END,
        "fecha_baja" = EXCLUDED."fecha_baja",
        "updated_at" = NOW(),
        -- Solo llega acá si cambió algo (ver WHERE): queda pendiente para Plex.
        "novedad_plex_pendiente_desde" = COALESCE("cliente"."novedad_plex_pendiente_desde", NOW())
      WHERE
        "cliente"."status_cliente"  IS DISTINCT FROM EXCLUDED."status_cliente"
        OR "cliente"."categoria_id"   IS DISTINCT FROM EXCLUDED."categoria_id"
        OR "cliente"."tarjeta_fidely" IS DISTINCT FROM EXCLUDED."tarjeta_fidely"
        OR "cliente"."fecha_baja"     IS DISTINCT FROM EXCLUDED."fecha_baja"
        OR ($${nextPlaceholderIndex + 2} AND "cliente"."id_fidely" IS DISTINCT FROM EXCLUDED."id_fidely");
    `;

    const params = [
      entity.id,
      entity.dni,
      entity.status,
      entity.categoria.id,
      entity.tarjetaFidely,
      ...(typeof idFidelyVal === 'number' ? [idFidelyVal] : []),
      entity.fechaAlta ?? new Date(),
      entity.fechaBaja ?? null,
      hasExplicitIdFidely,
    ];

    await this.dataSource.query(sql, params);
  }

  private toDomain(e: ClienteEntity): Cliente {
    if (!e.categoria) {
      throw new Error(`Cliente ${e.id} sin categoria cargada`);
    }

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

    const idFidely = c.fidelyStatus.idFidely.value;
    if (idFidely !== undefined && idFidely !== null) {
      e.idFidely = idFidely;
    }

    e.fechaAlta = c.fidelyStatus.fechaAlta.value;
    e.fechaBaja = c.fidelyStatus.fechaBaja.value ?? null;
    return e;
  }
}
