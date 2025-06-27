import { ReglaEngineRequest } from '../interfaces/IReglaEngine';

/**
 * Criterios para filtrar reglas aplicables.
 * Se construye a partir del contexto del motor.
 */
export class ReglaCriteria {
  constructor(
    public readonly fecha: Date,
    public readonly tipo: string,
    public readonly clienteId: string,
    public readonly puntosSolicitados?: number,
    public readonly monto?: number,
    public readonly moneda?: string,
    public readonly saldoActual?: number,
  ) {}

  /**
   * Crea criterios a partir del contexto de ejecución.
   */
  public static fromContext(ctx: ReglaEngineRequest): ReglaCriteria {
    return new ReglaCriteria(
      ctx.fecha,
      ctx.tipo,
      ctx.clienteId,
      ctx.puntosSolicitados,
      ctx.monto,
      ctx.moneda,
      ctx.saldoActual,
    );
  }
}
