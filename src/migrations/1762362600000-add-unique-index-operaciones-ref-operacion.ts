import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueIndexOperacionesRefOperacion1762362600000
  implements MigrationInterface
{
  public readonly transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "uq_operaciones_ref_operacion_not_null" ON "operaciones" ("refOperacion") WHERE "refOperacion" IS NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX CONCURRENTLY IF EXISTS "uq_operaciones_ref_operacion_not_null"',
    );
  }
}
