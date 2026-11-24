export interface UseCaseResponse {
  response: string;
  dto: unknown;
  /**
   * Se ejecuta cuando la respuesta terminó de enviarse completa (no si la
   * conexión se corta antes). Ej: avanzar la marca de novedades entregadas.
   */
  onDelivered?: () => Promise<void>;
}
