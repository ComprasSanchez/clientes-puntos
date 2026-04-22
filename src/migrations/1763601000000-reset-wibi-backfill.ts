import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetWibiBackfill1763601000000 implements MigrationInterface {
  public readonly transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS wibi_sync_imported_movements (
        movement_id BIGINT PRIMARY KEY,
        operation_id BIGINT NULL,
        ref_movement_id BIGINT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE wibi_sync_imported_movements
      ADD COLUMN IF NOT EXISTS operation_id BIGINT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE wibi_sync_imported_movements
      ADD COLUMN IF NOT EXISTS ref_movement_id BIGINT NULL
    `);

    await queryRunner.query(`
      DELETE FROM transacciones t
      USING operaciones o
      WHERE t."operationId" = o.id
        AND o."origenTipo" = 'WIBI_SYNC_TEMP'
    `);

    await queryRunner.query(`
      DELETE FROM operaciones o
      WHERE o."origenTipo" = 'WIBI_SYNC_TEMP'
    `);

    await queryRunner.query(`
      INSERT INTO wibi_sync_checkpoint (id, last_fecha, last_movimiento_id, updated_at)
      VALUES (1, TIMESTAMP '1900-01-01 00:00:00', 0, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        last_fecha = EXCLUDED.last_fecha,
        last_movimiento_id = EXCLUDED.last_movimiento_id,
        updated_at = NOW()
    `);

    await queryRunner.query(`TRUNCATE TABLE wibi_sync_imported_movements`);
  }

  public async down(): Promise<void> {
    // irreversible: no-op
  }
}
