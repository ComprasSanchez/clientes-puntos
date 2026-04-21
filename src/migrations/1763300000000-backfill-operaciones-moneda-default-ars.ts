import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillOperacionesMonedaDefaultArs1763300000000
  implements MigrationInterface
{
  public readonly transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 10000;
    const arsEnum = `'ARS'::operacion_moneda_enum`;

    while (true) {
      const result = await queryRunner.query(`
        WITH updated AS (
          UPDATE operaciones o
          SET moneda = ${arsEnum}
          WHERE o.ctid IN (
            SELECT i.ctid
            FROM operaciones i
            WHERE i.moneda IS DISTINCT FROM ${arsEnum}
            LIMIT ${batchSize}
          )
          RETURNING 1
        )
        SELECT COUNT(*)::int AS affected FROM updated
      `);

      const affected = Number(result?.[0]?.affected ?? 0);
      if (affected === 0) break;
    }

    await queryRunner.query(`
      ALTER TABLE operaciones
      ALTER COLUMN moneda SET DEFAULT 'ARS'::operacion_moneda_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE operaciones
      ALTER COLUMN moneda DROP DEFAULT
    `);
  }
}
