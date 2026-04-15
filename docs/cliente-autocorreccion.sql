-- Autocorreccion masiva de datos de cliente (PostgreSQL)
-- Objetivo: limpiar y normalizar campos que suelen romper Value Objects.
--
-- Campos corregidos:
-- - dni
-- - nombre
-- - apellido
-- - sexo
-- - email
-- - telefono
-- - cod_postal
-- - localidad
-- - provincia
-- - tarjeta_fidely
--
-- Seguridad:
-- 1) genera backup por corrida en cliente_autocorrect_backup
-- 2) hace UPDATE solo de filas con cambios
--
-- Recomendado:
-- - ejecutar primero el archivo docs/cliente-restricciones-auditoria.sql
-- - luego ejecutar este script completo dentro de una ventana controlada

BEGIN;

CREATE TABLE IF NOT EXISTS cliente_autocorrect_backup (
  run_at timestamptz NOT NULL,
  id uuid NOT NULL,
  dni varchar(10),
  nombre varchar(50),
  apellido varchar(50),
  sexo char(1),
  email varchar(150),
  telefono varchar(15),
  cod_postal varchar(10),
  localidad varchar(100),
  provincia varchar(100),
  tarjeta_fidely varchar(20),
  updated_at timestamptz,
  PRIMARY KEY (run_at, id)
);

CREATE OR REPLACE FUNCTION cliente_fix_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN input IS NULL THEN NULL
    ELSE
      trim(
        regexp_replace(
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
          ),
          '\\s+',
          ' ',
          'g'
        )
      )
  END
$$;

WITH run AS (
  SELECT now() AS run_at
), base AS (
  SELECT
    c.id,
    c.dni,
    c.nombre,
    c.apellido,
    c.sexo,
    c.email,
    c.telefono,
    c.cod_postal,
    c.localidad,
    c.provincia,
    c.tarjeta_fidely,
    c.updated_at,

    cliente_fix_text(c.dni) AS dni_raw,
    cliente_fix_text(c.nombre) AS nombre_raw,
    cliente_fix_text(c.apellido) AS apellido_raw,
    cliente_fix_text(c.sexo) AS sexo_raw,
    cliente_fix_text(c.email) AS email_raw,
    cliente_fix_text(c.telefono) AS telefono_raw,
    cliente_fix_text(c.cod_postal) AS cod_postal_raw,
    cliente_fix_text(c.localidad) AS localidad_raw,
    cliente_fix_text(c.provincia) AS provincia_raw,
    cliente_fix_text(c.tarjeta_fidely) AS tarjeta_raw
  FROM cliente c
), normalized AS (
  SELECT
    b.id,

    CASE
      WHEN b.dni_raw IS NULL THEN b.dni
      ELSE
        CASE
          WHEN regexp_replace(b.dni_raw, '[^0-9]', '', 'g') ~ '^\\d{6,10}$'
            THEN regexp_replace(b.dni_raw, '[^0-9]', '', 'g')
          ELSE b.dni
        END
    END AS dni_new,

    CASE
      WHEN b.nombre_raw IS NULL THEN b.nombre
      ELSE
        COALESCE(
          NULLIF(
            initcap(lower(trim(regexp_replace(replace(b.nombre_raw, '*', ''), '\\s+', ' ', 'g')))),
            ''
          ),
          b.nombre
        )
    END AS nombre_new,

    CASE
      WHEN b.apellido_raw IS NULL THEN b.apellido
      ELSE
        COALESCE(
          NULLIF(
            initcap(lower(trim(regexp_replace(replace(b.apellido_raw, '*', ''), '\\s+', ' ', 'g')))),
            ''
          ),
          b.apellido
        )
    END AS apellido_new,

    CASE
      WHEN upper(COALESCE(b.sexo_raw, '')) IN ('M', 'F', 'N', 'X') THEN upper(b.sexo_raw)
      WHEN b.sexo_raw IS NULL OR btrim(b.sexo_raw) = '' THEN 'N'
      WHEN upper(b.sexo_raw) IN ('*', '-', '.', 'NA', 'N/A', 'S/D', 'SD', 'NULL', '(NULL)') THEN 'N'
      ELSE 'N'
    END AS sexo_new,

    CASE
      WHEN b.email_raw IS NULL OR btrim(b.email_raw) = '' THEN NULL
      WHEN upper(b.email_raw) IN ('*', '-', '.', 'NA', 'N/A', 'S/D', 'SD', 'NULL', '(NULL)') THEN NULL
      WHEN lower(b.email_raw) ~ '^(?!.*\\.\\.)([a-z0-9]+([._%+\\-]?[a-z0-9]+)*)@([a-z0-9]+([\\-]?[a-z0-9]+)*)(\\.[a-z0-9]+([\\-]?[a-z0-9]+)*)+$'
        THEN lower(b.email_raw)
      ELSE NULL
    END AS email_new,

    CASE
      WHEN b.telefono_raw IS NULL OR btrim(b.telefono_raw) = '' THEN NULL
      WHEN upper(b.telefono_raw) IN ('*', '-', '.', 'NA', 'N/A', 'S/D', 'SD', 'NULL', '(NULL)') THEN NULL
      ELSE
        CASE
          WHEN regexp_replace(b.telefono_raw, '[^0-9+]', '', 'g') ~ '^\\+?[0-9]{7,15}$'
            THEN regexp_replace(b.telefono_raw, '[^0-9+]', '', 'g')
          ELSE NULL
        END
    END AS telefono_new,

    CASE
      WHEN b.cod_postal_raw IS NULL OR btrim(b.cod_postal_raw) = '' THEN NULL
      WHEN regexp_replace(b.cod_postal_raw, '[^0-9]', '', 'g') ~ '^\\d{4,6}$'
        THEN regexp_replace(b.cod_postal_raw, '[^0-9]', '', 'g')
      ELSE NULL
    END AS cod_postal_new,

    CASE
      WHEN b.localidad_raw IS NULL OR btrim(b.localidad_raw) = '' THEN NULL
      WHEN upper(b.localidad_raw) IN ('*', '-', '.', 'NA', 'N/A', 'S/D', 'SD', 'NULL', '(NULL)') THEN NULL
      ELSE
        NULLIF(
          initcap(lower(trim(regexp_replace(replace(b.localidad_raw, '*', ''), '\\s+', ' ', 'g')))),
          ''
        )
    END AS localidad_new,

    CASE
      WHEN b.provincia_raw IS NULL OR btrim(b.provincia_raw) = '' THEN NULL
      WHEN upper(b.provincia_raw) IN ('*', '-', '.', 'NA', 'N/A', 'S/D', 'SD', 'NULL', '(NULL)') THEN NULL
      ELSE
        NULLIF(
          initcap(lower(trim(regexp_replace(replace(b.provincia_raw, '*', ''), '\\s+', ' ', 'g')))),
          ''
        )
    END AS provincia_new,

    CASE
      WHEN b.tarjeta_raw IS NULL THEN b.tarjeta_fidely
      ELSE
        CASE
          WHEN regexp_replace(b.tarjeta_raw, '[^0-9]', '', 'g') ~ '^\\d{1,16}$'
            THEN regexp_replace(b.tarjeta_raw, '[^0-9]', '', 'g')
          ELSE b.tarjeta_fidely
        END
    END AS tarjeta_fidely_new
  FROM base b
), to_change AS (
  SELECT
    c.*,
    n.dni_new,
    n.nombre_new,
    n.apellido_new,
    n.sexo_new,
    n.email_new,
    n.telefono_new,
    n.cod_postal_new,
    n.localidad_new,
    n.provincia_new,
    n.tarjeta_fidely_new
  FROM cliente c
  JOIN normalized n ON n.id = c.id
  WHERE
    c.dni IS DISTINCT FROM n.dni_new
    OR c.nombre IS DISTINCT FROM n.nombre_new
    OR c.apellido IS DISTINCT FROM n.apellido_new
    OR c.sexo IS DISTINCT FROM n.sexo_new
    OR c.email IS DISTINCT FROM n.email_new
    OR c.telefono IS DISTINCT FROM n.telefono_new
    OR c.cod_postal IS DISTINCT FROM n.cod_postal_new
    OR c.localidad IS DISTINCT FROM n.localidad_new
    OR c.provincia IS DISTINCT FROM n.provincia_new
    OR c.tarjeta_fidely IS DISTINCT FROM n.tarjeta_fidely_new
), backup AS (
  INSERT INTO cliente_autocorrect_backup (
    run_at,
    id,
    dni,
    nombre,
    apellido,
    sexo,
    email,
    telefono,
    cod_postal,
    localidad,
    provincia,
    tarjeta_fidely,
    updated_at
  )
  SELECT
    r.run_at,
    t.id,
    t.dni,
    t.nombre,
    t.apellido,
    t.sexo,
    t.email,
    t.telefono,
    t.cod_postal,
    t.localidad,
    t.provincia,
    t.tarjeta_fidely,
    t.updated_at
  FROM to_change t
  CROSS JOIN run r
  RETURNING id
)
UPDATE cliente c
SET
  dni = t.dni_new,
  nombre = t.nombre_new,
  apellido = t.apellido_new,
  sexo = t.sexo_new,
  email = t.email_new,
  telefono = t.telefono_new,
  cod_postal = t.cod_postal_new,
  localidad = t.localidad_new,
  provincia = t.provincia_new,
  tarjeta_fidely = t.tarjeta_fidely_new,
  updated_at = now()
FROM to_change t
WHERE c.id = t.id;

-- Resumen rapido post-correccion
SELECT
  count(*) AS total_corregidos
FROM cliente_autocorrect_backup
WHERE run_at = (SELECT max(run_at) FROM cliente_autocorrect_backup);

COMMIT;

-- Rollback manual (si hiciera falta, ejecutar aparte con el run_at exacto):
-- UPDATE cliente c
-- SET
--   dni = b.dni,
--   nombre = b.nombre,
--   apellido = b.apellido,
--   sexo = b.sexo,
--   email = b.email,
--   telefono = b.telefono,
--   cod_postal = b.cod_postal,
--   localidad = b.localidad,
--   provincia = b.provincia,
--   tarjeta_fidely = b.tarjeta_fidely,
--   updated_at = b.updated_at
-- FROM cliente_autocorrect_backup b
-- WHERE b.run_at = '<RUN_AT_AQUI>'::timestamptz
--   AND b.id = c.id;

DROP FUNCTION IF EXISTS cliente_fix_text(text);
