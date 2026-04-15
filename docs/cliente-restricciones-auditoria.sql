-- Auditoria de clientes que incumplen reglas de formato de Value Objects.
-- Uso: ejecutar en PostgreSQL y revisar la columna `motivos`.

WITH checks AS (
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
    c.updated_at,

    (c.dni IS NULL OR c.dni !~ '^\d{6,10}$') AS bad_dni,

    (
      c.nombre IS NULL
      OR btrim(c.nombre) = ''
      OR char_length(c.nombre) > 50
      OR c.nombre !~ '^[A-Za-zÁÉÍÓÚáéíóúÑñÜü .''’\-–—]+$'
      OR c.nombre ~ '\*'
    ) AS bad_nombre,

    (
      c.apellido IS NULL
      OR btrim(c.apellido) = ''
      OR char_length(c.apellido) > 50
      OR c.apellido !~ '^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ''’\-–—]+$'
      OR c.apellido ~ '\*'
    ) AS bad_apellido,

    (upper(coalesce(c.sexo, '')) NOT IN ('M', 'F', 'N', 'X')) AS bad_sexo,

    (
      c.telefono IS NOT NULL
      AND btrim(c.telefono) <> ''
      AND c.telefono !~ '^\+?[0-9]{7,15}$'
    ) AS bad_telefono,

    (
      c.cod_postal IS NOT NULL
      AND btrim(c.cod_postal) <> ''
      AND c.cod_postal !~ '^\d{4,6}$'
    ) AS bad_cod_postal,

    (
      c.localidad IS NOT NULL
      AND btrim(c.localidad) <> ''
      AND c.localidad !~ '^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+( [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*$'
    ) AS bad_localidad,

    (
      c.provincia IS NOT NULL
      AND btrim(c.provincia) <> ''
      AND c.provincia !~ '^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+( [A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*$'
    ) AS bad_provincia,

    (
      c.email IS NOT NULL
      AND btrim(c.email) <> ''
      AND c.email !~ '^[A-Za-z0-9]+([._%+-]?[A-Za-z0-9]+)*@[A-Za-z0-9]+(-[A-Za-z0-9]+)*(\.[A-Za-z0-9]+(-[A-Za-z0-9]+)*)+$'
    ) AS bad_email
  FROM cliente c
)
SELECT
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
  updated_at,
  array_remove(
    ARRAY[
      CASE WHEN bad_dni THEN 'dni' END,
      CASE WHEN bad_nombre THEN 'nombre' END,
      CASE WHEN bad_apellido THEN 'apellido' END,
      CASE WHEN bad_sexo THEN 'sexo' END,
      CASE WHEN bad_email THEN 'email' END,
      CASE WHEN bad_telefono THEN 'telefono' END,
      CASE WHEN bad_cod_postal THEN 'cod_postal' END,
      CASE WHEN bad_localidad THEN 'localidad' END,
      CASE WHEN bad_provincia THEN 'provincia' END
    ],
    NULL
  ) AS motivos
FROM checks
WHERE
  bad_dni
  OR bad_nombre
  OR bad_apellido
  OR bad_sexo
  OR bad_email
  OR bad_telefono
  OR bad_cod_postal
  OR bad_localidad
  OR bad_provincia
ORDER BY updated_at DESC NULLS LAST, id;
