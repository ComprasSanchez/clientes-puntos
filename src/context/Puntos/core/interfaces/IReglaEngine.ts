// src/context/Puntos/core/interfaces/IReglaEngine.ts

export interface ReglaEngineRequest {
  operacionId: number;
  clienteId: string;
  tipo: string;
  fecha: Date;
  puntosSolicitados?: number;
  monto?: number;
  moneda?: string;
  // información adicional para reglas avanzadas:
  saldoActual: number;
  lotesDisponibles: Array<{
    loteId: string;
    remaining: number;
    expiraEn?: Date;
  }>;
}

export interface ReglaEngineResult {
  debitos: Array<{ loteId: string; cantidad: number }>;
  credito?: { cantidad: number; expiraEn: Date };
}

export interface IReglaEngine {
  procesar(request: ReglaEngineRequest): Promise<ReglaEngineResult>;
}
