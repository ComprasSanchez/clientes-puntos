import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupClientesDatosInvalidos1763000000000
  implements MigrationInterface
{
  public readonly transaction = true;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cliente_cleanup_backup_1763000000000 (
        id uuid PRIMARY KEY,
        nombre varchar(50),
        apellido varchar(50),
        telefono varchar(15),
        cod_postal varchar(10),
        localidad varchar(100),
        provincia varchar(100),
        updated_at timestamp with time zone,
        respaldado_en timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_fix_mojibake(input text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      AS $$
        SELECT CASE
          WHEN input IS NULL THEN NULL
          ELSE
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                replace(
                                  replace(
                                    replace(
                                      replace(
                                        replace(
                                          regexp_replace(input, '[[:cntrl:]]', '', 'g'),
                                          'Â',
                                          ''
                                        ),
                                        'Ã¡',
                                        'á'
                                      ),
                                      'Ã©',
                                      'é'
                                    ),
                                    'Ã­',
                                    'í'
                                  ),
                                  'Ã³',
                                  'ó'
                                ),
                                'Ãº',
                                'ú'
                              ),
                              'Ã',
                              'Á'
                            ),
                            'Ã‰',
                            'É'
                          ),
                          'Ã',
                          'Í'
                        ),
                        'Ã“',
                        'Ó'
                      ),
                      'Ãš',
                      'Ú'
                    ),
                    'Ã±',
                    'ñ'
                  ),
                  'Ã‘',
                  'Ñ'
                ),
                'Ã¼',
                'ü'
              ),
              'Ãœ',
              'Ü'
            )
        END
      $$
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_norm_text(input text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      AS $$
        SELECT CASE
          WHEN input IS NULL THEN NULL
          ELSE trim(regexp_replace(cleanup_fix_mojibake(input), '\\s+', ' ', 'g'))
        END
      $$
    `);

    await queryRunner.query(`
      WITH proposed AS (
        SELECT
          c.id,
          CASE
            WHEN cleanup_norm_text(c.nombre) IS NULL OR cleanup_norm_text(c.nombre) = '' THEN c.nombre
            ELSE initcap(lower(cleanup_norm_text(c.nombre)))
          END AS nombre_new,
          CASE
            WHEN cleanup_norm_text(c.apellido) IS NULL OR cleanup_norm_text(c.apellido) = '' THEN c.apellido
            ELSE initcap(lower(cleanup_norm_text(c.apellido)))
          END AS apellido_new,
          CASE
            WHEN c.telefono IS NULL THEN NULL
            ELSE regexp_replace(cleanup_norm_text(c.telefono), '[^0-9+]', '', 'g')
          END AS telefono_new,
          CASE
            WHEN cleanup_norm_text(c.cod_postal) ~ '^\\d{4,6}$' THEN cleanup_norm_text(c.cod_postal)
            ELSE NULL
          END AS cod_postal_new,
          CASE
            WHEN cleanup_norm_text(c.localidad) IS NULL OR cleanup_norm_text(c.localidad) = '' THEN NULL
            WHEN cleanup_norm_text(c.localidad) = upper(cleanup_norm_text(c.localidad))
              THEN initcap(lower(cleanup_norm_text(c.localidad)))
            ELSE cleanup_norm_text(c.localidad)
          END AS localidad_new,
          CASE
            WHEN cleanup_norm_text(c.provincia) IS NULL OR cleanup_norm_text(c.provincia) = '' THEN NULL
            WHEN cleanup_norm_text(c.provincia) = upper(cleanup_norm_text(c.provincia))
              THEN initcap(lower(cleanup_norm_text(c.provincia)))
            ELSE cleanup_norm_text(c.provincia)
          END AS provincia_new
        FROM cliente c
      ),
      cleaned AS (
        SELECT
          p.id,
          p.nombre_new,
          p.apellido_new,
          CASE
            WHEN p.telefono_new ~ '^\\+?\\d{7,15}$' THEN p.telefono_new
            ELSE NULL
          END AS telefono_new,
          p.cod_postal_new,
          p.localidad_new,
          p.provincia_new
        FROM proposed p
      )
      INSERT INTO cliente_cleanup_backup_1763000000000 (id, nombre, apellido, telefono, cod_postal, localidad, provincia, updated_at)
      SELECT c.id, c.nombre, c.apellido, c.telefono, c.cod_postal, c.localidad, c.provincia, c.updated_at
      FROM cliente c
      INNER JOIN cleaned x ON x.id = c.id
      WHERE c.nombre IS DISTINCT FROM x.nombre_new
         OR c.apellido IS DISTINCT FROM x.apellido_new
         OR c.telefono IS DISTINCT FROM x.telefono_new
         OR c.cod_postal IS DISTINCT FROM x.cod_postal_new
         OR c.localidad IS DISTINCT FROM x.localidad_new
         OR c.provincia IS DISTINCT FROM x.provincia_new
      ON CONFLICT (id) DO NOTHING
    `);

    await queryRunner.query(`
      WITH proposed AS (
        SELECT
          c.id,
          CASE
            WHEN cleanup_norm_text(c.nombre) IS NULL OR cleanup_norm_text(c.nombre) = '' THEN c.nombre
            ELSE initcap(lower(cleanup_norm_text(c.nombre)))
          END AS nombre_new,
          CASE
            WHEN cleanup_norm_text(c.apellido) IS NULL OR cleanup_norm_text(c.apellido) = '' THEN c.apellido
            ELSE initcap(lower(cleanup_norm_text(c.apellido)))
          END AS apellido_new,
          CASE
            WHEN c.telefono IS NULL THEN NULL
            ELSE regexp_replace(cleanup_norm_text(c.telefono), '[^0-9+]', '', 'g')
          END AS telefono_new,
          CASE
            WHEN cleanup_norm_text(c.cod_postal) ~ '^\\d{4,6}$' THEN cleanup_norm_text(c.cod_postal)
            ELSE NULL
          END AS cod_postal_new,
          CASE
            WHEN cleanup_norm_text(c.localidad) IS NULL OR cleanup_norm_text(c.localidad) = '' THEN NULL
            WHEN cleanup_norm_text(c.localidad) = upper(cleanup_norm_text(c.localidad))
              THEN initcap(lower(cleanup_norm_text(c.localidad)))
            ELSE cleanup_norm_text(c.localidad)
          END AS localidad_new,
          CASE
            WHEN cleanup_norm_text(c.provincia) IS NULL OR cleanup_norm_text(c.provincia) = '' THEN NULL
            WHEN cleanup_norm_text(c.provincia) = upper(cleanup_norm_text(c.provincia))
              THEN initcap(lower(cleanup_norm_text(c.provincia)))
            ELSE cleanup_norm_text(c.provincia)
          END AS provincia_new
        FROM cliente c
      ),
      cleaned AS (
        SELECT
          p.id,
          p.nombre_new,
          p.apellido_new,
          CASE
            WHEN p.telefono_new ~ '^\\+?\\d{7,15}$' THEN p.telefono_new
            ELSE NULL
          END AS telefono_new,
          p.cod_postal_new,
          p.localidad_new,
          p.provincia_new
        FROM proposed p
      )
      UPDATE cliente c
      SET
        nombre = x.nombre_new,
        apellido = x.apellido_new,
        telefono = x.telefono_new,
        cod_postal = x.cod_postal_new,
        localidad = x.localidad_new,
        provincia = x.provincia_new,
        updated_at = now()
      FROM cleaned x
      WHERE x.id = c.id
        AND (
          c.nombre IS DISTINCT FROM x.nombre_new
          OR c.apellido IS DISTINCT FROM x.apellido_new
          OR
          c.telefono IS DISTINCT FROM x.telefono_new
          OR c.cod_postal IS DISTINCT FROM x.cod_postal_new
          OR c.localidad IS DISTINCT FROM x.localidad_new
          OR c.provincia IS DISTINCT FROM x.provincia_new
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE cliente c
      SET
        nombre = b.nombre,
        apellido = b.apellido,
        telefono = b.telefono,
        cod_postal = b.cod_postal,
        localidad = b.localidad,
        provincia = b.provincia,
        updated_at = b.updated_at
      FROM cliente_cleanup_backup_1763000000000 b
      WHERE b.id = c.id
    `);

    await queryRunner.query(
      'DROP TABLE IF EXISTS cliente_cleanup_backup_1763000000000',
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS cleanup_norm_text(text)');
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS cleanup_fix_mojibake(text)',
    );
  }
}
