// @puntos/core/interfaces/IReglaEngine.ts

// ---- Tipos auxiliares (primitivos) ----
export type BaseProductoDTO = 'precio' | 'costo';

export interface MoneyDTO {
  amount: number;
  currency?: string; // ISO 4217 o código interno
}

export interface ClasificadorDTO {
  type: string; // ej: "categoria" | "marca"
  id: string | number;
}

export interface ProductoRuleItemDTO {
  productoId?: string; // SKU/UUID si lo tenés
  codExt?: number; // código externo opcional
  nombre?: string;

  cantidad?: number; // default=1 si no viene
  precio: MoneyDTO; // money plano
  costo: MoneyDTO; // money plano

  usarBase?: BaseProductoDTO; // hint para cálculos de puntos
  clasificadores?: ClasificadorDTO[];
  tags?: string[];
}

// ---- Contrato del motor desde Puntos ----
export interface ReglaEngineRequest {
  clienteId: string;
  tipo: string; // OpTipo en otra capa; aquí string plano
  fecha: Date | string; // permitimos ISO string para transporte
  puntosSolicitados?: number;
  monto?: number;
  moneda?: string;
  saldoActual: number;

  // 🔹 Nuevo: carrito opcional (compat si no se envía)
  productos?: ProductoRuleItemDTO[];
}

export interface ReglaEngineResult {
  debitAmount: number;
  credito?: { cantidad: number; expiraEn?: Date };
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
}

export interface IReglaEngine {
  procesar(request: ReglaEngineRequest): Promise<ReglaEngineResult>;
}
