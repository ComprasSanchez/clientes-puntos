import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueWibiDisponibleLotePerCliente1763700000000
  implements MigrationInterface
{
  public readonly transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          l.id,
          ROW_NUMBER() OVER (
            PARTITION BY l."clienteId"
            ORDER BY l."updatedAt" DESC, l."createdAt" DESC, l.id DESC
          ) AS rn
        FROM lotes l
        WHERE l."origenTipo" = 'WIBI_SYNC_SALDO'
          AND l.estado = 'DISPONIBLE'
      )
      UPDATE lotes AS l
      SET "remaining" = 0,
          "estado" = 'EXPIRADO',
          "updatedAt" = NOW()
      FROM ranked r
      WHERE l.id = r.id
        AND r.rn > 1
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "uq_lotes_wibi_sync_disponible_por_cliente" ON "lotes" ("clienteId") WHERE "origenTipo" = 'WIBI_SYNC_SALDO' AND "estado" = 'DISPONIBLE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX CONCURRENTLY IF EXISTS "uq_lotes_wibi_sync_disponible_por_cliente"',
    );
  }
}
