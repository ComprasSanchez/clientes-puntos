/**
 * Calcula el valor en pesos de un punto, dada la cotización puntos_por_peso.
 * @param puntosPorPeso - Cuántos puntos equivalen a $1. Ej: 1000
 * @returns Valor en $ de cada punto. Ej: 0.001
 */
export function valorPuntoEnPesos(puntosPorPeso: number): number {
  if (
    !puntosPorPeso ||
    typeof puntosPorPeso !== 'number' ||
    puntosPorPeso <= 0
  ) {
    throw new Error('La cotización debe ser un número mayor a cero');
  }
  return 1 / puntosPorPeso;
}
