/**
 * Estado de un lote de puntos en el sistema de fidelización.
 * - PENDIENTE: lote creado pero aún no disponible para gastar (e.g. periodo de gracia).
 * - DISPONIBLE: lote con puntos listos para consumir.
 * - EXPIRADO: lote que ha caducado; remaining = 0.
 */
export enum BatchEstado {
  PENDIENTE = 'PENDIENTE',
  DISPONIBLE = 'DISPONIBLE',
  EXPIRADO = 'EXPIRADO',
}
