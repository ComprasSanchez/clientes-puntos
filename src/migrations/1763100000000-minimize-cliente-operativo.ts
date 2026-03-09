import { MigrationInterface, QueryRunner } from 'typeorm';

export class MinimizeClienteOperativo1763100000000
  implements MigrationInterface
{
  public readonly transaction = true;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cliente
      ADD COLUMN IF NOT EXISTS fecha_alta timestamp with time zone
    `);

    await queryRunner.query(`
      UPDATE cliente
      SET fecha_alta = COALESCE(fecha_alta, created_at, now())
      WHERE fecha_alta IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente
      ALTER COLUMN fecha_alta SET DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE cliente
      ALTER COLUMN fecha_alta SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente
      DROP COLUMN IF EXISTS nombre,
      DROP COLUMN IF EXISTS apellido,
      DROP COLUMN IF EXISTS sexo,
      DROP COLUMN IF EXISTS fec_nacimiento,
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS telefono,
      DROP COLUMN IF EXISTS direccion,
      DROP COLUMN IF EXISTS cod_postal,
      DROP COLUMN IF EXISTS localidad,
      DROP COLUMN IF EXISTS provincia
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cliente
      ADD COLUMN IF NOT EXISTS nombre varchar(50),
      ADD COLUMN IF NOT EXISTS apellido varchar(50),
      ADD COLUMN IF NOT EXISTS sexo char(1),
      ADD COLUMN IF NOT EXISTS fec_nacimiento date,
      ADD COLUMN IF NOT EXISTS email varchar(150),
      ADD COLUMN IF NOT EXISTS telefono varchar(15),
      ADD COLUMN IF NOT EXISTS direccion varchar(200),
      ADD COLUMN IF NOT EXISTS cod_postal varchar(10),
      ADD COLUMN IF NOT EXISTS localidad varchar(100),
      ADD COLUMN IF NOT EXISTS provincia varchar(100)
    `);

    await queryRunner.query(`
      ALTER TABLE cliente
      DROP COLUMN IF EXISTS fecha_alta
    `);
  }
}
