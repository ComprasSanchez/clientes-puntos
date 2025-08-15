import { OpTipo } from '@shared/core/enums/OpTipo';
import { FechaOperacion } from '../value-objects/FechaOperacion';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { MontoMoneda } from '../value-objects/MontoMoneda';
import { Moneda } from '../value-objects/Moneda';
import { Producto } from 'src/context/Producto/core/entities/Producto';

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
  producto?: Producto; // para reglas por SKU/categorización/precio
  cantidad?: number; // unidades del ítem
  usarBase?: 'precio' | 'costo'; // fuente para cálculo de puntos por precio
}

export abstract class ReglaEngine {
  abstract procesar(request: ReglaEngineRequest): Promise<ReglaEngineResult>;
}
