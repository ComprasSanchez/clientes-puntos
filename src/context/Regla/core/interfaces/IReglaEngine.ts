// core/reglas/interfaces/IReglaEngine.ts
import { OpTipo } from '@shared/core/enums/OpTipo';
import { FechaOperacion } from '../value-objects/FechaOperacion';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { MontoMoneda } from '../value-objects/MontoMoneda';
import { Moneda } from '../value-objects/Moneda';
import { ProductoRuleItemDTO } from '../dto/ProductoRuleItemDTO';

export interface ReglaEngineResult {
  debitAmount: number;
  credito?: { cantidad: number; expiraEn?: Date };
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
}

export interface ReglaEngineRequest {
  clienteId: string;
  tipo: OpTipo;
  fecha: FechaOperacion;

  puntosSolicitados?: CantidadPuntos;
  monto?: MontoMoneda; // si no viene, lo derivamos del carrito
  moneda?: Moneda;
  saldoActual: CantidadPuntos;

  // 🔹 nuevo: array de líneas DTO (sin entidad Producto)
  productos?: ProductoRuleItemDTO[];
}

export abstract class ReglaEngine {
  abstract procesar(request: ReglaEngineRequest): Promise<ReglaEngineResult>;
}
