import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ClienteEntity } from '@cliente/infrastructure/entities/ClienteEntity';
import { CategoriaEntity } from '@cliente/infrastructure/entities/CategoriaEntity';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { TipoMoneda } from '@shared/core/enums/TipoMoneda';
import { OperacionEntity } from '@puntos/infrastructure/entities/operacion.entity';
import { TransaccionEntity } from '@puntos/infrastructure/entities/transaccion.entity';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { DataSource, In, Repository } from 'typeorm';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { BatchEstado } from '@puntos/core/enums/BatchEstado';
import { StatusCliente } from '@cliente/core/enums/StatusCliente';
import {
  type Pool as MySqlPool,
  createPool as createMySqlPool,
} from 'mysql2/promise';

interface WibiSyncInput {
  batchSize?: number;
  dryRun?: boolean;
  maxBatches?: number;
}

interface SyncPhaseResult {
  processedBatches: number;
  stoppedByLimit: boolean;
}

interface ClienteSourceRow {
  sourceId: number;
  dni: string | null;
  tarjeta: string | null;
  saldo: number;
}

interface MovimientoSourceRow {
  movimientoId: number;
  sourceClienteId: number;
  fecha: Date;
  tipoMovimiento: string | null;
  monto: number | null;
  puntos: number;
  puntosDebito: number | null;
  idMovimientoRef: number | null;
  nroComprobante: string | null;
  comprobanteExt: string | null;
  descripcion: string | null;
}

interface PuntoVtaSucursalRow {
  puntoVta: number;
  sucursal: number;
  qty: number;
}

interface SyncCheckpoint {
  lastFecha: Date;
  lastMovimientoId: number;
}

interface SyncRunCounters {
  clientesLeidos: number;
  clientesCreados: number;
  clientesActualizados: number;
  clientesSinMatch: number;
  saldosActualizados: number;
  lotesSaldoCreados: number;
  lotesSaldoActualizados: number;
  lotesSaldoDuplicadosExpirados: number;
  movimientosLeidos: number;
  movimientosInsertados: number;
  movimientosDuplicados: number;
  movimientosSinMatch: number;
  movimientosError: number;
}

@Injectable()
export class WibiSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(WibiSyncService.name);
  private pool: Pool | null = null;
  private plexPool: MySqlPool | null = null;
  private puntoVtaSucursalCache = new Map<number, string>();
  private lastGeneratedOperacionId = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(ClienteEntity)
    private readonly clienteRepo: Repository<ClienteEntity>,
    @InjectRepository(CategoriaEntity)
    private readonly categoriaRepo: Repository<CategoriaEntity>,
    @InjectRepository(OperacionEntity)
    private readonly operacionRepo: Repository<OperacionEntity>,
    @InjectRepository(TransaccionEntity)
    private readonly transaccionRepo: Repository<TransaccionEntity>,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    if (this.plexPool) {
      await this.plexPool.end();
      this.plexPool = null;
    }
  }

  async run(input: WibiSyncInput): Promise<unknown> {
    const batchSize = this.resolveBatchSize(input.batchSize);
    const dryRun = this.resolveDryRun(input.dryRun);
    const maxBatches = this.resolveMaxBatches(input.maxBatches);
    const startedAt = new Date();

    this.logger.log(
      `[WIBI_SYNC] start dryRun=${dryRun} batchSize=${batchSize} maxBatches=${maxBatches ?? 'none'}`,
    );

    if (!dryRun && maxBatches !== null) {
      throw new Error('maxBatches is only supported when dryRun=true');
    }

    if (!dryRun) {
      await this.ensureInfraTables();
    }

    const counters: SyncRunCounters = {
      clientesLeidos: 0,
      clientesCreados: 0,
      clientesActualizados: 0,
      clientesSinMatch: 0,
      saldosActualizados: 0,
      lotesSaldoCreados: 0,
      lotesSaldoActualizados: 0,
      lotesSaldoDuplicadosExpirados: 0,
      movimientosLeidos: 0,
      movimientosInsertados: 0,
      movimientosDuplicados: 0,
      movimientosSinMatch: 0,
      movimientosError: 0,
    };

    let runId: string | null = null;
    if (!dryRun) {
      runId = await this.insertRun('RUNNING', null, counters, startedAt, null);
    }

    try {
      this.logger.log('[WIBI_SYNC] phase=syncClientes begin');
      const clientesPhase = await this.syncClientes(
        batchSize,
        counters,
        true,
        dryRun,
        maxBatches,
      );

      this.logger.log('[WIBI_SYNC] phase=syncMovimientos begin');
      const movimientosPhase = await this.syncMovimientos(
        batchSize,
        counters,
        dryRun,
        maxBatches,
      );

      this.logger.log('[WIBI_SYNC] phase=syncClientesAndSaldoByDelta end');

      if (runId) {
        await this.updateRun(runId, 'SUCCESS', null, counters, new Date());
      }

      return {
        runId,
        status: dryRun ? 'DRY_RUN' : 'SUCCESS',
        dryRun,
        maxBatches,
        phases: {
          clientes: clientesPhase,
          movimientos: movimientosPhase,
        },
        counters,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (runId) {
        await this.updateRun(runId, 'FAILED', message, counters, new Date());
      }
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`WIBI sync failed: ${message}`, stack);
      throw error;
    }
  }

  runInBackground(input: WibiSyncInput): void {
    this.logger.log('[WIBI_SYNC] background execution requested');

    setImmediate(() => {
      void this.run(input)
        .then((result) => {
          this.logger.log(
            `[WIBI_SYNC] background execution finished result=${JSON.stringify(result)}`,
          );
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          const stack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `[WIBI_SYNC] background execution failed: ${message}`,
            stack,
          );
        });
    });
  }

  private resolveBatchSize(raw?: number): number {
    const fromEnv = Number(
      this.config.get<string>('WIBI_SYNC_BATCH_SIZE') ?? '10000',
    );
    const base = Number.isFinite(raw) ? Number(raw) : fromEnv;
    return Math.max(1, Math.min(10000, Math.trunc(base || 10000)));
  }

  private resolveDryRun(raw?: boolean): boolean {
    if (typeof raw === 'boolean') {
      return raw;
    }

    const fromEnv = (
      this.config.get<string>('WIBI_SYNC_DRY_RUN_DEFAULT') ?? 'true'
    )
      .trim()
      .toLowerCase();

    return fromEnv === '1' || fromEnv === 'true' || fromEnv === 'yes';
  }

  private resolveMaxBatches(raw?: number): number | null {
    if (raw === undefined || raw === null) {
      return null;
    }

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.max(1, Math.trunc(value));
  }

  private getPool(): Pool {
    if (this.pool) {
      return this.pool;
    }

    const connectionString = this.config.get<string>('WIBI_DUMP_DATABASE_URL');
    if (!connectionString) {
      throw new Error('Missing WIBI_DUMP_DATABASE_URL');
    }

    this.pool = new Pool({ connectionString });
    return this.pool;
  }

  private async ensureInfraTables(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS wibi_sync_checkpoint (
        id SMALLINT PRIMARY KEY,
        last_fecha TIMESTAMP NOT NULL,
        last_movimiento_id BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS wibi_sync_runs (
        id UUID PRIMARY KEY,
        status VARCHAR(20) NOT NULL,
        error_message TEXT NULL,
        started_at TIMESTAMPTZ NOT NULL,
        finished_at TIMESTAMPTZ NULL,
        counters JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS wibi_sync_dead_letter (
        id UUID PRIMARY KEY,
        movement_id BIGINT NOT NULL,
        source_cliente_id BIGINT NOT NULL,
        payload JSONB NOT NULL,
        error_message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS wibi_sync_imported_movements (
        movement_id BIGINT PRIMARY KEY,
        operation_id BIGINT NULL,
        ref_movement_id BIGINT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.dataSource.query(`
      ALTER TABLE wibi_sync_imported_movements
      ADD COLUMN IF NOT EXISTS operation_id BIGINT NULL
    `);

    await this.dataSource.query(`
      ALTER TABLE wibi_sync_imported_movements
      ADD COLUMN IF NOT EXISTS ref_movement_id BIGINT NULL
    `);

    await this.dataSource.query(
      `INSERT INTO wibi_sync_checkpoint (id, last_fecha, last_movimiento_id)
       VALUES (1, TIMESTAMP '1900-01-01 00:00:00', 0)
       ON CONFLICT (id) DO NOTHING`,
    );
  }

  private async insertRun(
    status: 'RUNNING' | 'SUCCESS' | 'FAILED',
    errorMessage: string | null,
    counters: SyncRunCounters,
    startedAt: Date,
    finishedAt: Date | null,
  ): Promise<string> {
    const runId = randomUUID();
    const rows = (await this.dataSource.query(
      `INSERT INTO wibi_sync_runs (id, status, error_message, counters, started_at, finished_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)
       RETURNING id`,
      [
        runId,
        status,
        errorMessage,
        JSON.stringify(counters),
        startedAt,
        finishedAt,
      ],
    )) as Array<{ id: string }>;

    return rows[0].id;
  }

  private async updateRun(
    runId: string,
    status: 'SUCCESS' | 'FAILED',
    errorMessage: string | null,
    counters: SyncRunCounters,
    finishedAt: Date,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE wibi_sync_runs
       SET status = $2,
           error_message = $3,
           counters = $4::jsonb,
           finished_at = $5
       WHERE id = $1`,
      [runId, status, errorMessage, JSON.stringify(counters), finishedAt],
    );
  }

  private async syncClientes(
    batchSize: number,
    counters: SyncRunCounters,
    updateCards: boolean,
    dryRun: boolean,
    maxBatches: number | null,
  ): Promise<SyncPhaseResult> {
    const table = this.resolveTableRef(
      this.config.get<string>('WIBI_CLIENTES_TABLE') ?? 'destino_clientes',
    );
    const idColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_CLIENTES_ID_COLUMN') ?? 'IdCliente',
    );
    const cardColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_CLIENTES_CARD_COLUMN') ?? 'NroTarjeta',
    );
    const saldoColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_CLIENTES_SALDO_COLUMN') ?? 'SaldoPuntos',
    );
    const dniColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_CLIENTES_DNI_COLUMN') ?? 'DNI',
    );
    let lastId = 0;
    let batchNumber = 0;
    let stoppedByLimit = false;
    const defaultCategoriaId = await this.getDefaultCategoriaId();

    this.logger.log(
      `[WIBI_SYNC][clientes] begin table=${table} idColumn=${idColumn} cardColumn=${cardColumn} saldoColumn=${saldoColumn} defaultCategoriaId=${defaultCategoriaId}`,
    );

    while (true) {
      if (maxBatches !== null && batchNumber >= maxBatches) {
        stoppedByLimit = true;
        this.logger.log(
          `[WIBI_SYNC][clientes] stop reason=max_batches_reached maxBatches=${maxBatches}`,
        );
        break;
      }

      batchNumber += 1;
      const batchStartedAt = Date.now();

      this.logger.log(
        `[WIBI_SYNC][clientes] batch=${batchNumber} step=fetch lastId=${lastId}`,
      );

      const sql = `
        SELECT
          ${idColumn} AS "sourceId",
          ${dniColumn} AS "dni",
          ${cardColumn} AS "tarjeta",
          ${saldoColumn} AS "saldo"
        FROM ${table}
        WHERE ${idColumn} IS NOT NULL
          AND ${idColumn} > $1
        ORDER BY ${idColumn} ASC
        LIMIT $2
      `;

      const rows = await this.queryExternal<ClienteSourceRow>(sql, [
        lastId,
        batchSize,
      ]);
      if (rows.length === 0) {
        this.logger.log(
          `[WIBI_SYNC][clientes] batch=${batchNumber} step=done reason=no_rows totalRead=${counters.clientesLeidos}`,
        );
        break;
      }

      counters.clientesLeidos += rows.length;

      const sourceIds = rows.map((row) => Number(row.sourceId));
      const clientes = await this.clienteRepo.find({
        where: { idFidely: In(sourceIds) },
        select: {
          id: true,
          dni: true,
          idFidely: true,
          tarjetaFidely: true,
        },
      });

      const dnis = rows
        .map((row) => this.normalizeDni(row.dni, Number(row.sourceId)))
        .filter(
          (dni, index, arr) => dni.length > 0 && arr.indexOf(dni) === index,
        );

      const clientesByDni = dnis.length
        ? await this.clienteRepo.find({
            where: { dni: In(dnis) },
            select: {
              id: true,
              dni: true,
              idFidely: true,
              tarjetaFidely: true,
            },
          })
        : [];

      const byFidely = new Map<number, ClienteEntity>();
      for (const cliente of clientes) {
        if (typeof cliente.idFidely === 'number') {
          byFidely.set(cliente.idFidely, cliente);
        }
      }

      const byDni = new Map<string, ClienteEntity>();
      for (const cliente of clientesByDni) {
        byDni.set(cliente.dni, cliente);
      }

      for (const row of rows) {
        const sourceId = Number(row.sourceId);
        const normalizedDni = this.normalizeDni(row.dni, sourceId);
        let cliente = byFidely.get(sourceId);

        if (!cliente && normalizedDni.length > 0) {
          const byDniCliente = byDni.get(normalizedDni);
          if (byDniCliente) {
            cliente = byDniCliente;
            byFidely.set(sourceId, byDniCliente);

            if (!dryRun) {
              await this.clienteRepo.update(
                { id: byDniCliente.id },
                {
                  idFidely: sourceId,
                },
              );
            }
          }
        }

        if (!cliente) {
          if (!dryRun) {
            const created = await this.createClienteFromSource(
              row,
              defaultCategoriaId,
            );
            cliente = created;
          } else {
            cliente = this.clienteRepo.create({
              id: randomUUID(),
              dni: normalizedDni,
              status: StatusCliente.Activo,
              tarjetaFidely: this.normalizeCard(row.tarjeta, sourceId),
              idFidely: sourceId,
            });
          }

          counters.clientesCreados += 1;

          if (cliente) {
            byFidely.set(sourceId, cliente);
            if (normalizedDni.length > 0) {
              byDni.set(normalizedDni, cliente);
            }
          }
        }

        if (!cliente) {
          counters.clientesSinMatch += 1;
          continue;
        }

        if (updateCards) {
          const newCard = this.normalizeCard(row.tarjeta, sourceId);
          if (newCard.length > 0 && newCard !== cliente.tarjetaFidely) {
            if (!dryRun) {
              await this.clienteRepo.update(
                { id: cliente.id },
                {
                  tarjetaFidely: newCard,
                },
              );
            }
            counters.clientesActualizados += 1;
          }
        }

        if (!dryRun) {
          await this.reconcileSaldoAndLoteByDelta(
            cliente.id,
            sourceId,
            this.normalizePoints(row.saldo),
            counters,
          );
        }
        counters.saldosActualizados += 1;
      }

      lastId = Number(rows[rows.length - 1].sourceId);

      this.logger.log(
        `[WIBI_SYNC][clientes] batch=${batchNumber} step=processed rows=${rows.length} nextLastId=${lastId} created=${counters.clientesCreados} updatedCards=${counters.clientesActualizados} saldosUpdated=${counters.saldosActualizados} noMatch=${counters.clientesSinMatch} elapsedMs=${Date.now() - batchStartedAt}`,
      );
    }

    return {
      processedBatches: batchNumber,
      stoppedByLimit,
    };
  }

  private async syncMovimientos(
    batchSize: number,
    counters: SyncRunCounters,
    dryRun: boolean,
    maxBatches: number | null,
  ): Promise<SyncPhaseResult> {
    const table = this.resolveTableRef(
      this.config.get<string>('WIBI_MOVIMIENTOS_TABLE') ??
        'destino_movimientos',
    );
    const idColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_ID_COLUMN') ?? 'IdMovimiento',
    );
    const clienteIdColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_CLIENTE_ID_COLUMN') ??
        'IdCliente',
    );
    const fechaColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_TS_COLUMN') ?? 'FechaHora',
    );
    const puntosColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_PUNTOS_COLUMN') ??
        'PuntosAcreditados',
    );
    const montoColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_MONTO_COLUMN') ?? 'Importe',
    );
    const tipoColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_TIPO_COLUMN') ??
        'IdTipoMovimiento',
    );
    const descripcionColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_DESCRIPCION_COLUMN') ??
        'Motivo',
    );
    const idMovimientoRefColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_ID_MOVIMIENTO_REF_COLUMN') ??
        'IdMovimientoRef',
    );
    const nroComprobanteColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_NRO_COMPROBANTE_COLUMN') ??
        'NroComprobante',
    );
    const comprobanteExtColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_COMPROBANTE_EXT_COLUMN') ??
        'ComprobanteExt',
    );
    const puntosDebitoColumnRaw =
      this.config.get<string>('WIBI_MOVIMIENTOS_PUNTOS_DEBITO_COLUMN') ??
      'PuntosDescontados';
    const puntosDebitoSelect = puntosDebitoColumnRaw
      ? `${this.safeIdentifier(puntosDebitoColumnRaw)} AS "puntosDebito"`
      : `0::numeric AS "puntosDebito"`;

    const checkpoint = await this.loadCheckpoint(dryRun);
    const importedTableAvailable = dryRun
      ? await this.tableExists('wibi_sync_imported_movements')
      : true;
    const baseCheckpoint = checkpoint;
    let currentCursor: SyncCheckpoint | null = null;
    let newestProcessed: SyncCheckpoint | null = null;
    let batchNumber = 0;
    let stoppedByLimit = false;

    this.logger.log(
      `[WIBI_SYNC][movimientos] begin table=${table} baseCheckpointFecha=${baseCheckpoint.lastFecha.toISOString()} baseCheckpointId=${baseCheckpoint.lastMovimientoId} order=DESC`,
    );

    while (true) {
      if (maxBatches !== null && batchNumber >= maxBatches) {
        stoppedByLimit = true;
        this.logger.log(
          `[WIBI_SYNC][movimientos] stop reason=max_batches_reached maxBatches=${maxBatches}`,
        );
        break;
      }

      batchNumber += 1;
      const batchStartedAt = Date.now();

      this.logger.log(
        `[WIBI_SYNC][movimientos] batch=${batchNumber} step=fetch baseCheckpointFecha=${baseCheckpoint.lastFecha.toISOString()} baseCheckpointId=${baseCheckpoint.lastMovimientoId} cursorFecha=${currentCursor?.lastFecha.toISOString() ?? 'none'} cursorId=${currentCursor?.lastMovimientoId ?? 'none'}`,
      );

      const sqlFirst = `
        SELECT
          ${idColumn} AS "movimientoId",
          ${clienteIdColumn} AS "sourceClienteId",
          ${fechaColumn} AS "fecha",
          ${tipoColumn} AS "tipoMovimiento",
          ${montoColumn} AS "monto",
          ${puntosColumn} AS "puntos",
          ${puntosDebitoSelect},
          ${idMovimientoRefColumn} AS "idMovimientoRef",
          ${nroComprobanteColumn} AS "nroComprobante",
          ${comprobanteExtColumn} AS "comprobanteExt",
          ${descripcionColumn} AS "descripcion"
        FROM ${table}
        WHERE (${fechaColumn} > $1
           OR (${fechaColumn} = $1 AND ${idColumn} > $2))
        ORDER BY ${fechaColumn} DESC, ${idColumn} DESC
        LIMIT $3
      `;

      const sqlNext = `
        SELECT
          ${idColumn} AS "movimientoId",
          ${clienteIdColumn} AS "sourceClienteId",
          ${fechaColumn} AS "fecha",
          ${tipoColumn} AS "tipoMovimiento",
          ${montoColumn} AS "monto",
          ${puntosColumn} AS "puntos",
          ${puntosDebitoSelect},
          ${idMovimientoRefColumn} AS "idMovimientoRef",
          ${nroComprobanteColumn} AS "nroComprobante",
          ${comprobanteExtColumn} AS "comprobanteExt",
          ${descripcionColumn} AS "descripcion"
        FROM ${table}
        WHERE (${fechaColumn} > $1
           OR (${fechaColumn} = $1 AND ${idColumn} > $2))
          AND (${fechaColumn} < $3
           OR (${fechaColumn} = $3 AND ${idColumn} < $4))
        ORDER BY ${fechaColumn} DESC, ${idColumn} DESC
        LIMIT $5
      `;

      const rows = currentCursor
        ? await this.queryExternal<MovimientoSourceRow>(sqlNext, [
            baseCheckpoint.lastFecha,
            baseCheckpoint.lastMovimientoId,
            currentCursor.lastFecha,
            currentCursor.lastMovimientoId,
            batchSize,
          ])
        : await this.queryExternal<MovimientoSourceRow>(sqlFirst, [
            baseCheckpoint.lastFecha,
            baseCheckpoint.lastMovimientoId,
            batchSize,
          ]);

      if (rows.length === 0) {
        this.logger.log(
          `[WIBI_SYNC][movimientos] batch=${batchNumber} step=done reason=no_rows totalRead=${counters.movimientosLeidos}`,
        );
        break;
      }

      counters.movimientosLeidos += rows.length;

      const sourceClienteIds = Array.from(
        new Set(rows.map((row) => Number(row.sourceClienteId))),
      );

      const clientes = await this.clienteRepo.find({
        where: { idFidely: In(sourceClienteIds) },
        select: {
          id: true,
          idFidely: true,
        },
      });

      const byFidely = new Map<number, string>();
      for (const cliente of clientes) {
        if (typeof cliente.idFidely === 'number') {
          byFidely.set(cliente.idFidely, cliente.id);
        }
      }

      const insertCandidates: Array<{
        entity: OperacionEntity;
        row: MovimientoSourceRow;
        transacciones: TransaccionEntity[];
        movementId: number;
        operationId: number;
        refMovementId: number | null;
      }> = [];
      const movementIds = rows.map((row) => Number(row.movimientoId));
      const importedMovements = await this.findAlreadyImportedMovements(
        movementIds,
        importedTableAvailable,
      );
      const referencedMovementIds: number[] = Array.from(
        new Set(
          rows
            .map((row) => Number(row.idMovimientoRef ?? 0))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      );
      const refAnulacionByMovementId = await this.findOperationIdsByMovementIds(
        referencedMovementIds,
        importedTableAvailable,
      );
      const sucursalByPuntoVta = await this.resolveSucursalByPuntoVta(rows);

      for (const row of rows) {
        const movementId = Number(row.movimientoId);
        const sourceClienteId = Number(row.sourceClienteId);
        if (importedMovements.has(movementId)) {
          counters.movimientosDuplicados += 1;
          continue;
        }

        const clienteId = byFidely.get(sourceClienteId);
        if (!clienteId) {
          counters.movimientosSinMatch += 1;
          continue;
        }

        const puntosCredito = Number(row.puntos ?? 0);
        const puntosDebito = Number(row.puntosDebito ?? 0);
        const puntosRaw = puntosCredito - puntosDebito;
        const puntos = this.normalizeMovementPoints(puntosRaw);
        if (puntos === 0) {
          counters.movimientosDuplicados += 1;
          continue;
        }

        const tipoOperacion = this.resolveOperacionTipo(row, puntosRaw);
        const nroComprobante = this.normalizeNullableText(
          row.nroComprobante,
          50,
        );
        const comprobanteExt = this.normalizeNullableText(
          row.comprobanteExt,
          50,
        );
        const refOperacion = nroComprobante;
        const referenciaTransaccion = nroComprobante ?? comprobanteExt;

        const puntoVta = this.parsePuntoVtaFromNroComprobante(nroComprobante);
        const codSucursal =
          puntoVta !== null
            ? (sucursalByPuntoVta.get(puntoVta) ?? String(puntoVta))
            : null;
        const refMovementId = this.resolveRefMovementId(row);

        const operationId = this.nextOperacionId();
        const entity = this.operacionRepo.create({
          id: operationId,
          clienteId,
          tipo: tipoOperacion,
          fecha: new Date(row.fecha),
          origenTipo: this.getOrigenTipo(),
          puntos,
          monto: this.normalizeMovementAmount(row.monto),
          moneda: TipoMoneda.ARS,
          refOperacion,
          refAnulacion:
            refMovementId !== null
              ? (refAnulacionByMovementId.get(refMovementId) ?? null)
              : null,
          codSucursal,
          items: null,
        });

        const transacciones = this.buildTransacciones(
          row,
          operationId,
          referenciaTransaccion,
        );

        if (transacciones.length === 0) {
          counters.movimientosDuplicados += 1;
          continue;
        }

        insertCandidates.push({
          entity,
          row,
          transacciones,
          movementId,
          operationId,
          refMovementId,
        });

        refAnulacionByMovementId.set(movementId, operationId);
      }

      await this.persistMovimientosBatch(insertCandidates, counters, dryRun);

      const firstRow = rows[0];
      const lastRow = rows[rows.length - 1];
      if (!newestProcessed && firstRow) {
        newestProcessed = {
          lastFecha: new Date(firstRow.fecha),
          lastMovimientoId: Number(firstRow.movimientoId),
        };
      }
      currentCursor = {
        lastFecha: new Date(lastRow.fecha),
        lastMovimientoId: Number(lastRow.movimientoId),
      };

      this.logger.log(
        `[WIBI_SYNC][movimientos] batch=${batchNumber} step=processed rows=${rows.length} inserted=${counters.movimientosInsertados} duplicated=${counters.movimientosDuplicados} noMatch=${counters.movimientosSinMatch} errors=${counters.movimientosError} nextCursorFecha=${currentCursor.lastFecha.toISOString()} nextCursorId=${currentCursor.lastMovimientoId} elapsedMs=${Date.now() - batchStartedAt}`,
      );
    }

    if (!dryRun) {
      await this.reconcileRefAnulaciones(importedTableAvailable);
    }

    if (!dryRun && newestProcessed) {
      await this.saveCheckpoint(newestProcessed);
      this.logger.log(
        `[WIBI_SYNC][movimientos] step=checkpoint_saved fecha=${newestProcessed.lastFecha.toISOString()} id=${newestProcessed.lastMovimientoId}`,
      );
    }

    return {
      processedBatches: batchNumber,
      stoppedByLimit,
    };
  }

  private async loadCheckpoint(dryRun: boolean): Promise<SyncCheckpoint> {
    if (dryRun) {
      const hasCheckpointTable = await this.tableExists('wibi_sync_checkpoint');
      if (!hasCheckpointTable) {
        return {
          lastFecha: new Date('1900-01-01T00:00:00.000Z'),
          lastMovimientoId: 0,
        };
      }
    }

    const rows = (await this.dataSource.query(
      `SELECT last_fecha AS "lastFecha", last_movimiento_id AS "lastMovimientoId"
       FROM wibi_sync_checkpoint
       WHERE id = 1`,
    )) as Array<{ lastFecha: Date; lastMovimientoId: number }>;

    if (rows.length === 0) {
      return {
        lastFecha: new Date('1900-01-01T00:00:00.000Z'),
        lastMovimientoId: 0,
      };
    }

    return {
      lastFecha: new Date(rows[0].lastFecha),
      lastMovimientoId: Number(rows[0].lastMovimientoId),
    };
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const rows = (await this.dataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS "exists"`,
      [tableName],
    )) as Array<{ exists: boolean }>;

    return rows.length > 0 && rows[0].exists === true;
  }

  private async saveCheckpoint(cp: SyncCheckpoint): Promise<void> {
    await this.dataSource.query(
      `UPDATE wibi_sync_checkpoint
       SET last_fecha = $1,
           last_movimiento_id = $2,
           updated_at = NOW()
       WHERE id = 1`,
      [cp.lastFecha, cp.lastMovimientoId],
    );
  }

  private async insertDeadLetter(
    row: MovimientoSourceRow,
    errorMessage: string,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO wibi_sync_dead_letter (id, movement_id, source_cliente_id, payload, error_message)
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [
        randomUUID(),
        Number(row.movimientoId),
        Number(row.sourceClienteId),
        JSON.stringify(row),
        errorMessage,
      ],
    );
  }

  private async persistMovimientosBatch(
    insertCandidates: Array<{
      entity: OperacionEntity;
      row: MovimientoSourceRow;
      transacciones: TransaccionEntity[];
      movementId: number;
      operationId: number;
      refMovementId: number | null;
    }>,
    counters: SyncRunCounters,
    dryRun: boolean,
  ): Promise<void> {
    if (insertCandidates.length === 0) {
      return;
    }

    if (dryRun) {
      counters.movimientosInsertados += insertCandidates.length;
      return;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .insert()
          .into(OperacionEntity)
          .values(insertCandidates.map((candidate) => candidate.entity))
          .execute();

        const txEntities = insertCandidates.flatMap(
          (candidate) => candidate.transacciones,
        );
        if (txEntities.length > 0) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(TransaccionEntity)
            .values(txEntities)
            .execute();
        }

        await manager.query(
          `INSERT INTO wibi_sync_imported_movements (movement_id, operation_id, ref_movement_id, imported_at)
           SELECT u.movement_id, u.operation_id, u.ref_movement_id, NOW()
           FROM UNNEST($1::bigint[], $2::bigint[], $3::bigint[]) AS u(movement_id, operation_id, ref_movement_id)
           ON CONFLICT (movement_id)
           DO UPDATE SET
             operation_id = EXCLUDED.operation_id,
             ref_movement_id = EXCLUDED.ref_movement_id,
             imported_at = EXCLUDED.imported_at`,
          [
            insertCandidates.map((candidate) => candidate.movementId),
            insertCandidates.map((candidate) => candidate.operationId),
            insertCandidates.map((candidate) => candidate.refMovementId),
          ],
        );
      });

      counters.movimientosInsertados += insertCandidates.length;
      return;
    } catch (bulkError) {
      const bulkMessage =
        bulkError instanceof Error
          ? bulkError.message
          : 'unknown bulk insert error';
      this.logger.warn(
        `[WIBI_SYNC][movimientos] bulk_insert_failed fallback=row_by_row reason=${bulkMessage}`,
      );
    }

    for (const candidate of insertCandidates) {
      try {
        await this.dataSource.transaction(async (manager) => {
          await manager.insert(OperacionEntity, candidate.entity);
          if (candidate.transacciones.length > 0) {
            await manager.insert(TransaccionEntity, candidate.transacciones);
          }
          await manager.query(
            `INSERT INTO wibi_sync_imported_movements (movement_id, operation_id, ref_movement_id, imported_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (movement_id)
             DO UPDATE SET
               operation_id = EXCLUDED.operation_id,
               ref_movement_id = EXCLUDED.ref_movement_id,
               imported_at = EXCLUDED.imported_at`,
            [
              candidate.movementId,
              candidate.operationId,
              candidate.refMovementId,
            ],
          );
        });
        counters.movimientosInsertados += 1;
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          counters.movimientosDuplicados += 1;
          continue;
        }

        counters.movimientosError += 1;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        await this.insertDeadLetter(candidate.row, errorMessage);
      }
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    const code =
      typeof error === 'object' && error !== null
        ? ((error as { code?: unknown }).code ??
          (error as { driverError?: { code?: unknown } }).driverError?.code)
        : undefined;

    return code === '23505';
  }

  private async queryExternal<T>(sql: string, params: unknown[]): Promise<T[]> {
    const pool = this.getPool();
    const result = await pool.query(sql, params);
    return result.rows as T[];
  }

  private getOrigenTipo(): string {
    return this.config.get<string>('WIBI_ORIGEN_TIPO') ?? 'WIBI_SYNC_TEMP';
  }

  private resolveRefMovementId(row: MovimientoSourceRow): number | null {
    const idMovimientoRef = Number(row.idMovimientoRef ?? 0);
    if (!Number.isFinite(idMovimientoRef) || idMovimientoRef <= 0) {
      return null;
    }
    return idMovimientoRef;
  }

  private resolveOperacionTipo(
    row: MovimientoSourceRow,
    puntosRaw: number,
  ): OpTipo {
    const tipoRaw = Number(row.tipoMovimiento ?? 0);
    switch (tipoRaw) {
      case 1:
        return OpTipo.COMPRA;
      case 2:
        return OpTipo.DEVOLUCION;
      case 3:
        return OpTipo.ANULACION;
      case 5:
        return OpTipo.AJUSTE;
      default:
        break;
    }

    const comprobanteTipo = this.parseComprobanteTipo(row.nroComprobante);
    if (comprobanteTipo === 'NC') {
      return OpTipo.DEVOLUCION;
    }
    if (comprobanteTipo === 'FV') {
      return OpTipo.COMPRA;
    }

    return puntosRaw >= 0 ? OpTipo.COMPRA : OpTipo.AJUSTE;
  }

  private buildTransacciones(
    row: MovimientoSourceRow,
    operationId: number,
    referenciaId: string | null,
  ): TransaccionEntity[] {
    const result: TransaccionEntity[] = [];

    const puntosAcreditados = this.normalizePoints(row.puntos);
    if (puntosAcreditados > 0) {
      result.push(
        this.transaccionRepo.create({
          id: randomUUID(),
          operationId,
          loteId: randomUUID(),
          tipo: TxTipo.ACREDITACION,
          cantidad: puntosAcreditados,
          referenciaId,
          reglasAplicadas: {},
        }),
      );
    }

    const puntosDebito = this.normalizePoints(row.puntosDebito);
    if (puntosDebito > 0) {
      result.push(
        this.transaccionRepo.create({
          id: randomUUID(),
          operationId,
          loteId: randomUUID(),
          tipo: TxTipo.GASTO,
          cantidad: puntosDebito,
          referenciaId,
          reglasAplicadas: {},
        }),
      );
    }

    return result;
  }

  private parseComprobanteTipo(nroComprobante: string | null | undefined):
    | 'FV'
    | 'NC'
    | null {
    const normalized = this.normalizeNullableText(nroComprobante, 50);
    if (!normalized) {
      return null;
    }
    const match = normalized.match(/^([A-Za-z]{2})\s+/);
    if (!match) {
      return null;
    }
    const token = match[1].toUpperCase();
    if (token === 'FV' || token === 'NC') {
      return token;
    }
    return null;
  }

  private parsePuntoVtaFromNroComprobante(
    nroComprobante: string | null | undefined,
  ): number | null {
    const normalized = this.normalizeNullableText(nroComprobante, 50);
    if (!normalized) {
      return null;
    }

    const match = normalized.match(/^[A-Za-z]{2}\s+([0-9]{4})\s+[0-9]{8}$/);
    if (!match) {
      return null;
    }

    const value = Number(match[1]);
    if (!Number.isFinite(value)) {
      return null;
    }
    return value;
  }

  private async findAlreadyImportedMovements(
    movementIds: number[],
    tableAvailable = true,
  ): Promise<Set<number>> {
    if (movementIds.length === 0 || !tableAvailable) {
      return new Set<number>();
    }

    const rows = (await this.dataSource.query(
      `SELECT movement_id
       FROM wibi_sync_imported_movements
       WHERE movement_id = ANY($1::bigint[])`,
      [movementIds],
    )) as Array<{ movement_id: number }>;

    return new Set(rows.map((row) => Number(row.movement_id)));
  }

  private async findOperationIdsByMovementIds(
    movementIds: number[],
    tableAvailable = true,
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    if (movementIds.length === 0 || !tableAvailable) {
      return result;
    }

    const rows = (await this.dataSource.query(
      `SELECT movement_id, operation_id
       FROM wibi_sync_imported_movements
       WHERE movement_id = ANY($1::bigint[])
         AND operation_id IS NOT NULL`,
      [movementIds],
    )) as Array<{ movement_id: number; operation_id: number }>;

    for (const row of rows) {
      const movementId = Number(row.movement_id);
      const operationId = Number(row.operation_id);
      if (Number.isFinite(movementId) && Number.isFinite(operationId)) {
        result.set(movementId, operationId);
      }
    }

    return result;
  }

  private async reconcileRefAnulaciones(
    importedTableAvailable: boolean,
  ): Promise<void> {
    if (!importedTableAvailable) {
      return;
    }

    await this.dataSource.query(
      `UPDATE operaciones AS anul
       SET "refAnulacion" = src.operation_id
       FROM wibi_sync_imported_movements AS rel
       JOIN wibi_sync_imported_movements AS src
         ON src.movement_id = rel.ref_movement_id
       WHERE rel.operation_id = anul.id
         AND anul."origenTipo" = $1
         AND anul.tipo = $2
         AND src.operation_id IS NOT NULL
         AND (anul."refAnulacion" IS NULL OR anul."refAnulacion" <> src.operation_id)`,
      [this.getOrigenTipo(), OpTipo.ANULACION],
    );
  }

  private async resolveSucursalByPuntoVta(
    rows: MovimientoSourceRow[],
  ): Promise<Map<number, string>> {
    const puntoVtas = Array.from(
      new Set(
        rows
          .map((row) => this.parsePuntoVtaFromNroComprobante(row.nroComprobante))
          .filter((value): value is number => value !== null),
      ),
    );

    const result = new Map<number, string>();
    if (puntoVtas.length === 0) {
      return result;
    }

    const unresolved = puntoVtas.filter(
      (puntoVta) => !this.puntoVtaSucursalCache.has(puntoVta),
    );

    if (unresolved.length > 0) {
      try {
        const sourceRows = await this.fetchPuntoVtaSucursalRows(unresolved);
        const grouped = new Map<number, PuntoVtaSucursalRow[]>();
        for (const row of sourceRows) {
          const puntoVta = Number(row.puntoVta);
          if (!Number.isFinite(puntoVta)) {
            continue;
          }
          const current = grouped.get(puntoVta) ?? [];
          current.push(row);
          grouped.set(puntoVta, current);
        }

        for (const [puntoVta, alternatives] of grouped.entries()) {
          alternatives.sort((a, b) => Number(b.qty) - Number(a.qty));
          const top = alternatives[0];
          if (!top) {
            continue;
          }
          this.puntoVtaSucursalCache.set(
            puntoVta,
            String(Number(top.sucursal)),
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `[WIBI_SYNC][movimientos] no se pudo resolver sucursal por PuntoVta desde PLEX: ${message}`,
        );
      }
    }

    for (const puntoVta of puntoVtas) {
      const codSucursal = this.puntoVtaSucursalCache.get(puntoVta);
      if (codSucursal) {
        result.set(puntoVta, codSucursal);
      }
    }

    return result;
  }

  private async fetchPuntoVtaSucursalRows(
    puntoVtas: number[],
  ): Promise<PuntoVtaSucursalRow[]> {
    if (puntoVtas.length === 0) {
      return [];
    }

    const pool = this.getPlexPool();
    const placeholders = puntoVtas.map(() => '?').join(',');
    const sql = `
      SELECT
        CAST(PuntoVta AS UNSIGNED) AS puntoVta,
        CAST(Sucursal AS UNSIGNED) AS sucursal,
        COUNT(*) AS qty
      FROM factcabecera
      WHERE PuntoVta IN (${placeholders})
      GROUP BY PuntoVta, Sucursal
    `;

    const [rows] = await pool.query(sql, puntoVtas);
    return rows as PuntoVtaSucursalRow[];
  }

  private getPlexPool(): MySqlPool {
    if (this.plexPool) {
      return this.plexPool;
    }

    const url = this.resolvePlexConnectionUrl();
    if (!url) {
      throw new Error(
        'Missing PLEX database config. Set WIBI_PLEX_DATABASE_URL, DB_PLEX_URL o PLEX_DB_*',
      );
    }

    this.plexPool = createMySqlPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: 2,
      enableKeepAlive: true,
    });

    return this.plexPool;
  }

  private resolvePlexConnectionUrl(): string | null {
    const fromUrl = this.config.get<string>('WIBI_PLEX_DATABASE_URL');
    if (fromUrl && fromUrl.trim().length > 0) {
      return fromUrl.trim();
    }

    const legacyUrl = this.config.get<string>('DB_PLEX_URL');
    if (legacyUrl && legacyUrl.trim().length > 0) {
      return legacyUrl.trim();
    }

    const host = this.config.get<string>('PLEX_DB_HOST');
    const port = this.config.get<string>('PLEX_DB_PORT');
    const database = this.config.get<string>('PLEX_DB_DATABASE');
    const user = this.config.get<string>('PLEX_DB_USER');
    const password = this.config.get<string>('PLEX_DB_PASSWORD') ?? '';

    if (
      !host ||
      host.trim().length === 0 ||
      !port ||
      port.trim().length === 0 ||
      !database ||
      database.trim().length === 0 ||
      !user ||
      user.trim().length === 0
    ) {
      return null;
    }

    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  private normalizePoints(value: unknown): number {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) {
      return 0;
    }
    return Math.max(0, Math.trunc(num));
  }

  private normalizeMovementPoints(value: unknown): number {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) {
      return 0;
    }
    return Math.max(0, Math.trunc(Math.abs(num)));
  }

  private normalizeMovementAmount(value: unknown): number {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) {
      return 0;
    }
    return Math.max(0, Math.abs(num));
  }

  private nextOperacionId(): number {
    const base = Date.now() * 1000;
    this.lastGeneratedOperacionId = Math.max(
      base,
      this.lastGeneratedOperacionId + 1,
    );
    return this.lastGeneratedOperacionId;
  }

  private async reconcileSaldoAndLoteByDelta(
    clienteId: string,
    sourceId: number,
    saldo: number,
    counters: SyncRunCounters,
  ): Promise<void> {
    const referencia = this.getSaldoLoteRef(sourceId);
    const origen = this.getSaldoLoteOrigen();

    const rows = (await this.dataSource.query(
      `WITH saldo_upsert AS (
         INSERT INTO saldo_cliente (cliente_id, saldo_total)
         VALUES ($1, $2)
         ON CONFLICT (cliente_id)
         DO UPDATE SET saldo_total = EXCLUDED.saldo_total
       ),
       ranked_sync AS (
         SELECT
           l.id,
           l."cantidadOriginal",
           l."remaining",
           ROW_NUMBER() OVER (
             ORDER BY l."updatedAt" DESC, l."createdAt" DESC, l.id DESC
           ) AS rn
         FROM lotes l
         WHERE l."clienteId" = $1
           AND l."origenTipo" = $5
           AND l.estado = $4
       ),
       expired_duplicates AS (
         UPDATE lotes AS l
         SET "remaining" = 0,
             "estado" = $6,
             "updatedAt" = NOW()
         FROM ranked_sync rs
         WHERE l.id = rs.id
           AND rs.rn > 1
         RETURNING l.id
       ),
       existing AS (
          SELECT rs.id, rs."cantidadOriginal", rs."remaining"
          FROM ranked_sync rs
          WHERE rs.rn = 1
          LIMIT 1
       ),
       updated AS (
          UPDATE lotes AS l
          SET "cantidadOriginal" = GREATEST(0, e."cantidadOriginal" + ($2 - e."remaining")),
              "remaining" = GREATEST(0, e."remaining" + ($2 - e."remaining")),
             "estado" = $4,
             "origenTipo" = $5,
             "updatedAt" = NOW()
         FROM existing AS e
         WHERE l.id = e.id
           AND ($2 - e."remaining") <> 0
         RETURNING l.id
       ),
       inserted AS (
         INSERT INTO lotes (
           "clienteId",
           "cantidadOriginal",
           "remaining",
           "estado",
           "origenTipo",
           "referenciaId",
           "expiraEn",
           "createdAt",
           "updatedAt"
         )
         SELECT $1, $2, $2, $4, $5, $3, NULL, NOW(), NOW()
         WHERE NOT EXISTS (SELECT 1 FROM existing)
         RETURNING id
       )
        SELECT
          (SELECT COUNT(*)::int FROM inserted) AS inserted_count,
          (SELECT COUNT(*)::int FROM updated) AS updated_count,
          (SELECT COUNT(*)::int FROM expired_duplicates) AS duplicated_expired_count`,
      [
        clienteId,
        saldo,
        referencia,
        BatchEstado.DISPONIBLE,
        origen,
        BatchEstado.EXPIRADO,
      ],
    )) as Array<{
      inserted_count: number;
      updated_count: number;
      duplicated_expired_count: number;
    }>;

    const result = rows[0];
    if (!result) {
      return;
    }

    counters.lotesSaldoCreados += Number(result.inserted_count ?? 0);
    counters.lotesSaldoActualizados += Number(result.updated_count ?? 0);
    counters.lotesSaldoDuplicadosExpirados += Number(
      result.duplicated_expired_count ?? 0,
    );
  }

  private getSaldoLoteRef(sourceId: number): string {
    return `WIBI-SALDO:${sourceId}`;
  }

  private getSaldoLoteOrigen(): string {
    return (
      this.config.get<string>('WIBI_SALDO_LOTE_ORIGEN') ?? 'WIBI_SYNC_SALDO'
    );
  }

  private async getDefaultCategoriaId(): Promise<string> {
    const categoria = await this.categoriaRepo.findOne({
      where: { isDefault: true },
      select: { id: true },
      order: { updatedAt: 'DESC' },
    });

    if (!categoria) {
      throw new Error('No default categoria found to create missing clientes');
    }

    return categoria.id;
  }

  private async createClienteFromSource(
    row: ClienteSourceRow,
    categoriaId: string,
  ): Promise<ClienteEntity> {
    const sourceId = Number(row.sourceId);
    const cliente = this.clienteRepo.create({
      id: randomUUID(),
      dni: this.normalizeDni(row.dni, sourceId),
      status: StatusCliente.Activo,
      tarjetaFidely: this.normalizeCard(row.tarjeta, sourceId),
      idFidely: sourceId,
      categoria: { id: categoriaId } as CategoriaEntity,
      fechaBaja: null,
    });

    return this.clienteRepo.save(cliente);
  }

  private normalizeDni(
    value: string | null | undefined,
    sourceId: number,
  ): string {
    const digits = String(value ?? '')
      .replace(/\D/g, '')
      .trim();
    if (digits.length > 0) {
      return digits.slice(-10).padStart(10, '0');
    }
    return String(sourceId).slice(-10).padStart(10, '0');
  }

  private normalizeCard(
    value: string | null | undefined,
    sourceId: number,
  ): string {
    const raw = this.normalizeNullableText(value, 20);
    if (raw && raw.length > 0) {
      return raw;
    }
    return String(sourceId).slice(0, 20);
  }

  private normalizeNullableText(
    value: string | null | undefined,
    maxLength: number,
  ): string | null {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return null;
    }
    return raw.slice(0, maxLength);
  }

  private resolveTableRef(raw: string): string {
    const normalized = raw.trim();
    if (!normalized) {
      throw new Error('Invalid empty table reference');
    }

    const parts = normalized
      .split('.')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => this.safeIdentifier(item));

    if (parts.length === 1) {
      return parts[0];
    }

    if (parts.length === 2) {
      return `${parts[0]}.${parts[1]}`;
    }

    throw new Error(`Invalid table reference: ${raw}`);
  }

  private safeIdentifier(raw: string): string {
    const value = raw.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
      throw new Error(`Invalid SQL identifier: ${raw}`);
    }
    return `"${value}"`;
  }
}
