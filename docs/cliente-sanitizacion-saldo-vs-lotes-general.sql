-- Sanitizacion general: alinea lotes DISPONIBLES con saldo_cliente.saldo_total.
-- Aplica a clientes con cualquier cantidad de lotes DISPONIBLES.
--
-- Regla aplicada:
-- - Solo corrige casos con excedente (suma_lotes_disponibles > saldo_total).
-- - Elimina lotes completos y, si hace falta, reduce un lote parcial
--   hasta que la suma quede exactamente igual al saldo actual.
-- - Casos con faltante (suma_lotes_disponibles < saldo_total) NO se tocan.
--
-- Uso: ejecutar en PostgreSQL.

BEGIN;

-- 1) Previsualizacion de acciones
WITH objetivos AS (
  SELECT
    sc.cliente_id,
    sc.saldo_total,
    COALESCE(SUM(l.remaining), 0)::int AS suma_lotes_disponibles,
    (COALESCE(SUM(l.remaining), 0)::int - sc.saldo_total) AS excedente
  FROM saldo_cliente sc
  JOIN lotes l
    ON l."clienteId" = sc.cliente_id
   AND l.estado = 'DISPONIBLE'
  GROUP BY sc.cliente_id, sc.saldo_total
  HAVING COALESCE(SUM(l.remaining), 0)::int > sc.saldo_total
),
ordenados AS (
  SELECT
    l.id AS lote_id,
    l."clienteId" AS cliente_id,
    l.remaining,
    o.saldo_total,
    o.suma_lotes_disponibles,
    o.excedente,
    COALESCE(
      SUM(l.remaining) OVER (
        PARTITION BY l."clienteId"
        ORDER BY l.remaining DESC, l.id
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ),
      0
    )::int AS acumulado_prev
  FROM lotes l
  JOIN objetivos o
    ON o.cliente_id = l."clienteId"
  WHERE l.estado = 'DISPONIBLE'
),
acciones AS (
  SELECT
    lote_id,
    cliente_id,
    remaining,
    saldo_total,
    suma_lotes_disponibles,
    excedente,
    acumulado_prev,
    CASE
      WHEN acumulado_prev >= excedente THEN 'KEEP'
      WHEN acumulado_prev + remaining <= excedente THEN 'DELETE'
      ELSE 'REDUCE'
    END AS accion,
    GREATEST(excedente - acumulado_prev, 0)::int AS reducir_en,
    (remaining - GREATEST(excedente - acumulado_prev, 0)::int) AS remaining_nuevo
  FROM ordenados
)
SELECT
  cliente_id,
  lote_id,
  accion,
  remaining AS remaining_actual,
  CASE WHEN accion = 'REDUCE' THEN remaining_nuevo ELSE NULL END AS remaining_ajustado,
  saldo_total,
  suma_lotes_disponibles,
  excedente
FROM acciones
WHERE accion IN ('DELETE', 'REDUCE')
ORDER BY cliente_id, accion DESC, lote_id;

-- 2) Aplicacion de cambios
WITH objetivos AS (
  SELECT
    sc.cliente_id,
    sc.saldo_total,
    COALESCE(SUM(l.remaining), 0)::int AS suma_lotes_disponibles,
    (COALESCE(SUM(l.remaining), 0)::int - sc.saldo_total) AS excedente
  FROM saldo_cliente sc
  JOIN lotes l
    ON l."clienteId" = sc.cliente_id
   AND l.estado = 'DISPONIBLE'
  GROUP BY sc.cliente_id, sc.saldo_total
  HAVING COALESCE(SUM(l.remaining), 0)::int > sc.saldo_total
),
ordenados AS (
  SELECT
    l.id AS lote_id,
    l."clienteId" AS cliente_id,
    l.remaining,
    o.excedente,
    COALESCE(
      SUM(l.remaining) OVER (
        PARTITION BY l."clienteId"
        ORDER BY l.remaining DESC, l.id
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ),
      0
    )::int AS acumulado_prev
  FROM lotes l
  JOIN objetivos o
    ON o.cliente_id = l."clienteId"
  WHERE l.estado = 'DISPONIBLE'
),
acciones AS (
  SELECT
    lote_id,
    cliente_id,
    remaining,
    CASE
      WHEN acumulado_prev >= excedente THEN 'KEEP'
      WHEN acumulado_prev + remaining <= excedente THEN 'DELETE'
      ELSE 'REDUCE'
    END AS accion,
    GREATEST(excedente - acumulado_prev, 0)::int AS reducir_en
  FROM ordenados
),
reducidos AS (
  UPDATE lotes l
  SET remaining = l.remaining - a.reducir_en
  FROM acciones a
  WHERE a.accion = 'REDUCE'
    AND a.lote_id = l.id
  RETURNING l.id, l."clienteId", l.remaining, l.estado
),
eliminados AS (
  DELETE FROM lotes l
  USING acciones a
  WHERE a.accion = 'DELETE'
    AND a.lote_id = l.id
  RETURNING l.id, l."clienteId", l.remaining, l.estado
)
SELECT 'UPDATED' AS tipo, r.id, r."clienteId", r.remaining, r.estado
FROM reducidos r
UNION ALL
SELECT 'DELETED' AS tipo, e.id, e."clienteId", e.remaining, e.estado
FROM eliminados e;

-- 3) Verificacion post-sanitizacion (deberian quedar solo faltantes o casos no DISPONIBLE)
WITH saldo_por_lotes AS (
  SELECT
    l."clienteId" AS cliente_id,
    COALESCE(SUM(l.remaining), 0)::int AS saldo_lotes_disponibles
  FROM lotes l
  WHERE l.estado = 'DISPONIBLE'
  GROUP BY l."clienteId"
)
SELECT
  sc.cliente_id,
  sc.saldo_total,
  COALESCE(spl.saldo_lotes_disponibles, 0) AS saldo_lotes_disponibles,
  (sc.saldo_total - COALESCE(spl.saldo_lotes_disponibles, 0)) AS diferencia
FROM saldo_cliente sc
LEFT JOIN saldo_por_lotes spl
  ON spl.cliente_id = sc.cliente_id
WHERE sc.saldo_total <> COALESCE(spl.saldo_lotes_disponibles, 0)
ORDER BY ABS(sc.saldo_total - COALESCE(spl.saldo_lotes_disponibles, 0)) DESC, sc.cliente_id;

COMMIT;
