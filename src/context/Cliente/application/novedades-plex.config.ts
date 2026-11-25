/**
 * Máximo de clientes de novedades para Plex (NOVEDADES_PLEX_MAX_CLIENTES,
 * default 5000, ~1 KB de XML por cliente). Se usa en dos lugares:
 * - la fila no deja más de este número publicados sin entregar;
 * - la respuesta a Plex nunca trae más que esto (red de seguridad).
 * Como la fila nunca supera el tope, la respuesta no necesita cortarse.
 */
export const NOVEDADES_PLEX_MAX_CLIENTES = (() => {
  const n = Number(process.env.NOVEDADES_PLEX_MAX_CLIENTES);
  return Number.isInteger(n) && n > 0 ? n : 5000;
})();
