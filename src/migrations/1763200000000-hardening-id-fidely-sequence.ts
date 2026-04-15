import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardeningIdFidelySequence1763200000000
  implements MigrationInterface
{
  public readonly transaction = true;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS cliente_id_fidely_seq_nuevo_sistema
      INCREMENT BY 1
      MINVALUE 1
      START WITH 1000000000
      CACHE 1
    `);

    await queryRunner.query(`
      SELECT setval(
        'cliente_id_fidely_seq_nuevo_sistema',
        GREATEST(
          COALESCE((SELECT MAX(id_fidely) FROM cliente), 0) + 1,
          1000000000
        ),
        false
      )
    `);

    await queryRunner.query(`
      ALTER TABLE cliente
      ALTER COLUMN id_fidely SET DEFAULT nextval('cliente_id_fidely_seq_nuevo_sistema')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cliente
      ALTER COLUMN id_fidely DROP DEFAULT
    `);
  }
}
