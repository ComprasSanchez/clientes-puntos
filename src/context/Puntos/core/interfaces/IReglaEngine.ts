// @puntos/core/interfaces/IReglaEngine.ts

export interface ReglaEngineRequest {
  clienteId: string;
  tipo: string;
  fecha: Date;
  puntosSolicitados?: number;
  monto?: number;
  moneda?: string;
  saldoActual: number;
}

export interface ReglaEngineResult {
  debitAmount: number;
  credito?: { cantidad: number; expiraEn?: Date };
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
}

export interface IReglaEngine {
  procesar(request: ReglaEngineRequest): Promise<ReglaEngineResult>;
}
