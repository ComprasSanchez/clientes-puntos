// src/context/Puntos/core/interfaces/IReglaEngine.ts

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
}

export interface IReglaEngine {
  procesar(request: ReglaEngineRequest): Promise<ReglaEngineResult>;
}
