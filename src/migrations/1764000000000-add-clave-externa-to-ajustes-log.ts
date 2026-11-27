import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Clave del sistema que pidió el ajuste (ej. el calendario de fin de año).
 * Única: si el mismo pedido llega dos veces, no se acredita dos veces.
 */
export class AddClaveExternaToAjustesLog1764000000000
  implements MigrationInterface
{
  public readonly transaction = true;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ajustes_log ADD COLUMN IF NOT EXISTS clave_externa varchar(160)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_ajustes_log_clave_externa
         ON ajustes_log (clave_externa) WHERE clave_externa IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_ajustes_log_clave_externa`,
    );
    await queryRunner.query(
      `ALTER TABLE ajustes_log DROP COLUMN IF EXISTS clave_externa`,
    );
  }
}
