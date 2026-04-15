-- Sanitizacion: elimina lotes DISPONIBLES que generan desfase contra saldo_cliente.
-- Caso objetivo: clientes con exactamente 2 lotes DISPONIBLES.
-- Regla: borrar solo el lote cuyo remaining coincide con el excedente:
--   excedente = suma_lotes_disponibles - saldo_cliente.saldo_total
-- Seguridad: solo elimina cuando hay un unico candidato por cliente.
-- Uso: ejecutar en PostgreSQL.

BEGIN;

-- 1) Previsualizacion: lotes que se eliminarian
WITH inconsistencias AS (
  SELECT
    sc.cliente_id,
    sc.saldo_total,
    SUM(l.remaining)::int AS suma_lotes_disponibles,
    COUNT(*)::int AS cant_lotes,
    (SUM(l.remaining)::int - sc.saldo_total) AS excedente
  FROM saldo_cliente sc
  JOIN lotes l
    ON l."clienteId" = sc.cliente_id
   AND l.estado = 'DISPONIBLE'
  GROUP BY sc.cliente_id, sc.saldo_total
  HAVING COUNT(*) = 2
     AND SUM(l.remaining)::int <> sc.saldo_total
     AND SUM(l.remaining)::int > sc.saldo_total
),
candidatos AS (
  SELECT
    l.id AS lote_id,
    l."clienteId" AS cliente_id,
    l.remaining,
    i.saldo_total,
    i.suma_lotes_disponibles,
    i.excedente,
    COUNT(*) OVER (PARTITION BY l."clienteId") AS candidatos_por_cliente
  FROM lotes l
  JOIN inconsistencias i
    ON i.cliente_id = l."clienteId"
  WHERE l.estado = 'DISPONIBLE'
    AND l.remaining = i.excedente
)
SELECT
  lote_id,
  cliente_id,
  remaining,
  saldo_total,
  suma_lotes_disponibles,
  excedente
FROM candidatos
WHERE candidatos_por_cliente = 1
ORDER BY cliente_id;

-- 2) Eliminacion efectiva
WITH inconsistencias AS (
  SELECT
    sc.cliente_id,
    sc.saldo_total,
    SUM(l.remaining)::int AS suma_lotes_disponibles,
    COUNT(*)::int AS cant_lotes,
    (SUM(l.remaining)::int - sc.saldo_total) AS excedente
  FROM saldo_cliente sc
  JOIN lotes l
    ON l."clienteId" = sc.cliente_id
   AND l.estado = 'DISPONIBLE'
  GROUP BY sc.cliente_id, sc.saldo_total
  HAVING COUNT(*) = 2
     AND SUM(l.remaining)::int <> sc.saldo_total
     AND SUM(l.remaining)::int > sc.saldo_total
),
candidatos AS (
  SELECT
    l.id AS lote_id,
    l."clienteId" AS cliente_id,
    COUNT(*) OVER (PARTITION BY l."clienteId") AS candidatos_por_cliente
  FROM lotes l
  JOIN inconsistencias i
    ON i.cliente_id = l."clienteId"
  WHERE l.estado = 'DISPONIBLE'
    AND l.remaining = i.excedente
),
a_borrar AS (
  SELECT lote_id, cliente_id
  FROM candidatos
  WHERE candidatos_por_cliente = 1
)
DELETE FROM lotes l
USING a_borrar b
WHERE l.id = b.lote_id
RETURNING l.id, l."clienteId", l.remaining, l.estado;

COMMIT;
