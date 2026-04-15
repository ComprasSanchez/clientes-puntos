-- Auditoria: valida que saldo_cliente.saldo_total coincida con la suma de lotes DISPONIBLES.
-- Uso: ejecutar en PostgreSQL.

WITH saldo_por_lotes AS (
  SELECT
    l."clienteId" AS cliente_id,
    COALESCE(SUM(l.remaining), 0)::int AS saldo_lotes_disponibles,
    COUNT(*)::int AS cantidad_lotes_disponibles
  FROM lotes l
  WHERE l.estado = 'DISPONIBLE'
  GROUP BY l."clienteId"
)
SELECT
  sc.cliente_id,
  concat_ws(' ', c.nombre, c.apellido) AS cliente_nombre,
  sc.saldo_total AS saldo_cliente_actual,
  COALESCE(spl.saldo_lotes_disponibles, 0) AS saldo_calculado_desde_lotes,
  COALESCE(spl.cantidad_lotes_disponibles, 0) AS cantidad_lotes_disponibles,
  (sc.saldo_total - COALESCE(spl.saldo_lotes_disponibles, 0)) AS diferencia
FROM saldo_cliente sc
LEFT JOIN saldo_por_lotes spl
  ON spl.cliente_id = sc.cliente_id
LEFT JOIN cliente c
  ON c.id = sc.cliente_id
WHERE sc.saldo_total <> COALESCE(spl.saldo_lotes_disponibles, 0)
ORDER BY ABS(sc.saldo_total - COALESCE(spl.saldo_lotes_disponibles, 0)) DESC, sc.cliente_id;
