import { OpTipo } from '@shared/core/enums/OpTipo';
import { FechaOperacion } from '../value-objects/FechaOperacion';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { MontoMoneda } from '../value-objects/MontoMoneda';
import { Moneda } from '../value-objects/Moneda';

/**
 * Resultado de la ejecución del motor de reglas.
 */
export interface ReglaEngineResult {
  debitAmount: number;
  credito?: { cantidad: number; expiraEn?: Date };
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
}

/**
 * Contexto que pasa el RuleEngine y las reglas individuales.
 */
export interface ReglaEngineRequest {
  clienteId: string;
  tipo: OpTipo;
  fecha: FechaOperacion;
  puntosSolicitados?: CantidadPuntos;
  monto?: MontoMoneda;
  moneda?: Moneda;
  saldoActual: CantidadPuntos;
}

export abstract class ReglaEngine {
  abstract procesar(request: ReglaEngineRequest): Promise<ReglaEngineResult>;
}
