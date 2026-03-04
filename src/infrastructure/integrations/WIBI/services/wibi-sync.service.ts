import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ClienteEntity } from '@cliente/infrastructure/entities/ClienteEntity';
import { CREATE_OPERACION_SERVICE, SALDO_REPO } from '@puntos/core/tokens/tokens';
import { CreateOperacionService } from '@puntos/application/services/CreateOperacionService';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { TransactionalRunner } from '@shared/infrastructure/transaction/TransactionalRunner';
import { OperacionEntity } from '@puntos/infrastructure/entities/operacion.entity';
import { DataSource, In, Repository } from 'typeorm';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

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
  descripcion: string | null;
}

interface SyncCheckpoint {
  lastFecha: Date;
  lastMovimientoId: number;
}

interface SyncRunCounters {
  clientesLeidos: number;
  clientesActualizados: number;
  clientesSinMatch: number;
  saldosActualizados: number;
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

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly txRunner: TransactionalRunner,
    @Inject(CREATE_OPERACION_SERVICE)
    private readonly createOperacionService: CreateOperacionService,
    @Inject(SALDO_REPO)
    private readonly saldoRepo: SaldoRepository,
    @InjectRepository(ClienteEntity)
    private readonly clienteRepo: Repository<ClienteEntity>,
    @InjectRepository(OperacionEntity)
    private readonly operacionRepo: Repository<OperacionEntity>,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
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
      clientesActualizados: 0,
      clientesSinMatch: 0,
      saldosActualizados: 0,
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

      this.logger.log('[WIBI_SYNC] phase=resetSaldoAndReloadFromSource begin');
      await this.resetSaldoAndReloadFromSource(batchSize, counters, dryRun);

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
          const message = error instanceof Error ? error.message : 'Unknown error';
          const stack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `[WIBI_SYNC] background execution failed: ${message}`,
            stack,
          );
        });
    });
  }

  private resolveBatchSize(raw?: number): number {
    const fromEnv = Number(this.config.get<string>('WIBI_SYNC_BATCH_SIZE') ?? '1000');
    const base = Number.isFinite(raw) ? Number(raw) : fromEnv;
    return Math.max(1, Math.min(5000, Math.trunc(base || 1000)));
  }

  private resolveDryRun(raw?: boolean): boolean {
    if (typeof raw === 'boolean') {
      return raw;
    }

    const fromEnv = (this.config.get<string>('WIBI_SYNC_DRY_RUN_DEFAULT') ?? 'true')
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
      [runId, status, errorMessage, JSON.stringify(counters), startedAt, finishedAt],
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

    let lastId = 0;
    let batchNumber = 0;
    let stoppedByLimit = false;

    this.logger.log(
      `[WIBI_SYNC][clientes] begin table=${table} idColumn=${idColumn} cardColumn=${cardColumn} saldoColumn=${saldoColumn}`,
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
          ${cardColumn} AS "tarjeta",
          ${saldoColumn} AS "saldo"
        FROM ${table}
        WHERE ${idColumn} IS NOT NULL
          AND ${idColumn} > $1
        ORDER BY ${idColumn} ASC
        LIMIT $2
      `;

      const rows = await this.queryExternal<ClienteSourceRow>(sql, [lastId, batchSize]);
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
          idFidely: true,
          tarjetaFidely: true,
        },
      });

      const byFidely = new Map<number, ClienteEntity>();
      for (const cliente of clientes) {
        if (typeof cliente.idFidely === 'number') {
          byFidely.set(cliente.idFidely, cliente);
        }
      }

      for (const row of rows) {
        const sourceId = Number(row.sourceId);
        const cliente = byFidely.get(sourceId);

        if (!cliente) {
          counters.clientesSinMatch += 1;
          continue;
        }

        if (updateCards) {
          const newCard = (row.tarjeta ?? '').trim();
          if (newCard.length > 0 && newCard !== cliente.tarjetaFidely) {
            if (!dryRun) {
              await this.clienteRepo.update({ id: cliente.id }, { tarjetaFidely: newCard });
            }
            counters.clientesActualizados += 1;
          }
        }

        if (!dryRun) {
          await this.saldoRepo.updateSaldo(cliente.id, this.normalizePoints(row.saldo));
        }
        counters.saldosActualizados += 1;
      }

      lastId = Number(rows[rows.length - 1].sourceId);

      this.logger.log(
        `[WIBI_SYNC][clientes] batch=${batchNumber} step=processed rows=${rows.length} nextLastId=${lastId} updatedCards=${counters.clientesActualizados} saldosUpdated=${counters.saldosActualizados} noMatch=${counters.clientesSinMatch} elapsedMs=${Date.now() - batchStartedAt}`,
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
      this.config.get<string>('WIBI_MOVIMIENTOS_TABLE') ?? 'destino_movimientos',
    );
    const idColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_ID_COLUMN') ?? 'IdMovimiento',
    );
    const clienteIdColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_CLIENTE_ID_COLUMN') ?? 'IdCliente',
    );
    const fechaColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_TS_COLUMN') ?? 'FechaHora',
    );
    const puntosColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_PUNTOS_COLUMN') ?? 'PuntosAcreditados',
    );
    const montoColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_MONTO_COLUMN') ?? 'Importe',
    );
    const tipoColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_TIPO_COLUMN') ?? 'IdTipoMovimiento',
    );
    const descripcionColumn = this.safeIdentifier(
      this.config.get<string>('WIBI_MOVIMIENTOS_DESCRIPCION_COLUMN') ?? 'Motivo',
    );
    const puntosDebitoColumnRaw = this.config.get<string>(
      'WIBI_MOVIMIENTOS_PUNTOS_DEBITO_COLUMN',
    );
    const puntosDebitoSelect = puntosDebitoColumnRaw
      ? `${this.safeIdentifier(puntosDebitoColumnRaw)} AS "puntosDebito"`
      : `0::numeric AS "puntosDebito"`;

    const checkpoint = await this.loadCheckpoint(dryRun);
    let currentCheckpoint = checkpoint;
    let batchNumber = 0;
    let stoppedByLimit = false;

    this.logger.log(
      `[WIBI_SYNC][movimientos] begin table=${table} checkpointFecha=${currentCheckpoint.lastFecha.toISOString()} checkpointId=${currentCheckpoint.lastMovimientoId}`,
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
        `[WIBI_SYNC][movimientos] batch=${batchNumber} step=fetch checkpointFecha=${currentCheckpoint.lastFecha.toISOString()} checkpointId=${currentCheckpoint.lastMovimientoId}`,
      );

      const sql = `
        SELECT
          ${idColumn} AS "movimientoId",
          ${clienteIdColumn} AS "sourceClienteId",
          ${fechaColumn} AS "fecha",
          ${tipoColumn} AS "tipoMovimiento",
          ${montoColumn} AS "monto",
          ${puntosColumn} AS "puntos",
          ${puntosDebitoSelect},
          ${descripcionColumn} AS "descripcion"
        FROM ${table}
        WHERE ${fechaColumn} > $1
           OR (${fechaColumn} = $1 AND ${idColumn} > $2)
        ORDER BY ${fechaColumn} ASC, ${idColumn} ASC
        LIMIT $3
      `;

      const rows = await this.queryExternal<MovimientoSourceRow>(sql, [
        currentCheckpoint.lastFecha,
        currentCheckpoint.lastMovimientoId,
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

      const refs = rows.map((row) => this.toExternalRef(Number(row.movimientoId)));
      const existing = await this.operacionRepo.find({
        where: { refOperacion: In(refs) },
        select: { refOperacion: true },
      });

      const existingRefs = new Set(
        existing.map((item) => item.refOperacion).filter((item): item is string => !!item),
      );

      for (const row of rows) {
        const movementId = Number(row.movimientoId);
        const sourceClienteId = Number(row.sourceClienteId);
        const referencia = this.toExternalRef(movementId);

        if (existingRefs.has(referencia)) {
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

        const txTipo = puntosRaw >= 0 ? TxTipo.ACREDITACION : TxTipo.GASTO;

        try {
          if (!dryRun) {
            await this.txRunner.runInTransaction(async (ctx) => {
              const req = {
                clienteId,
                tipo: OpTipo.AJUSTE,
                origenTipo: new OrigenOperacion(this.getOrigenTipo()),
                puntos,
                referencia: new ReferenciaMovimiento(referencia),
              };

              await this.createOperacionService.execute(req, ctx, txTipo);
            });
          }

          counters.movimientosInsertados += 1;
          existingRefs.add(referencia);
        } catch (error) {
          counters.movimientosError += 1;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!dryRun) {
            await this.insertDeadLetter(row, errorMessage);
          }
        }
      }

      const lastRow = rows[rows.length - 1];
      currentCheckpoint = {
        lastFecha: new Date(lastRow.fecha),
        lastMovimientoId: Number(lastRow.movimientoId),
      };

      if (!dryRun) {
        await this.saveCheckpoint(currentCheckpoint);
        this.logger.log(
          `[WIBI_SYNC][movimientos] batch=${batchNumber} step=checkpoint_saved fecha=${currentCheckpoint.lastFecha.toISOString()} id=${currentCheckpoint.lastMovimientoId}`,
        );
      }

      this.logger.log(
        `[WIBI_SYNC][movimientos] batch=${batchNumber} step=processed rows=${rows.length} inserted=${counters.movimientosInsertados} duplicated=${counters.movimientosDuplicados} noMatch=${counters.movimientosSinMatch} errors=${counters.movimientosError} elapsedMs=${Date.now() - batchStartedAt}`,
      );
    }

    return {
      processedBatches: batchNumber,
      stoppedByLimit,
    };
  }

  private async resetSaldoAndReloadFromSource(
    batchSize: number,
    counters: SyncRunCounters,
    dryRun: boolean,
  ): Promise<void> {
    if (dryRun) {
      this.logger.log('[WIBI_SYNC][saldo] dryRun=true skip resetSaldoAndReloadFromSource');
      return;
    }

    this.logger.log('[WIBI_SYNC][saldo] deleting saldo_cliente');
    await this.dataSource.query('DELETE FROM saldo_cliente');
    counters.saldosActualizados = 0;

    this.logger.log('[WIBI_SYNC][saldo] rebuilding saldo from source clients');
    await this.syncClientes(batchSize, counters, false, false, null);
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

  private async insertDeadLetter(row: MovimientoSourceRow, errorMessage: string): Promise<void> {
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

  private async queryExternal<T>(sql: string, params: unknown[]): Promise<T[]> {
    const pool = this.getPool();
    const result = await pool.query(sql, params);
    return result.rows as T[];
  }

  private toExternalRef(movimientoId: number): string {
    return `WIBI:${movimientoId}`;
  }

  private getOrigenTipo(): string {
    return this.config.get<string>('WIBI_ORIGEN_TIPO') ?? 'WIBI_SYNC_TEMP';
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
