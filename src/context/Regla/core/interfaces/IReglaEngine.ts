/**
 * Resultado de la ejecución del motor de reglas.
 */
export interface ReglaEngineResult {
  debitAmount: number;
  credito?: { cantidad: number; expiraEn?: Date };
}

/**
 * Contexto que pasa el RuleEngine y las reglas individuales.
 */
export interface ReglaEngineRequest {
  clienteId: string;
  tipo: string;
  fecha: Date;
  puntosSolicitados?: number;
  monto?: number;
  moneda?: string;
  saldoActual: number;
}
