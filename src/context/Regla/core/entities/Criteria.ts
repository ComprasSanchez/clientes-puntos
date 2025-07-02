import { OpTipo } from '@shared/core/enums/OpTipo';
import { ReglaEngineRequest } from '../interfaces/IReglaEngine';
import { FechaOperacion } from '../value-objects/FechaOperacion';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { MontoMoneda } from '../value-objects/MontoMoneda';
import { Moneda } from '../value-objects/Moneda';

/**
 * Criterios para filtrar reglas aplicables.
 * Se construye a partir del contexto del motor.
 */
export class ReglaCriteria {
  constructor(
    public readonly fecha: FechaOperacion,
    public readonly tipo: OpTipo,
    public readonly clienteId: string,
    public readonly puntosSolicitados?: CantidadPuntos,
    public readonly monto?: MontoMoneda,
    public readonly moneda?: Moneda,
    public readonly saldoActual?: CantidadPuntos,
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
