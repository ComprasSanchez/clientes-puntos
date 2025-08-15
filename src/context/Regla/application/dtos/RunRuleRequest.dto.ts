import { BaseProducto } from '@regla/core/enums/BaseProducto';

// @regla/application/dtos/ExecuteRulesRequest.dto.ts
export class ExecuteRulesRequestDto {
  clienteId: string;
  tipo: string;
  fecha: Date; // ISO
  puntosSolicitados?: number;
  monto?: number;
  moneda?: string;
  saldoActual: number;

  // 🔹 nuevo: carrito (opcional). Si no viene, todo sigue funcionando.
  productos?: Array<{
    productoId?: string;
    codExt?: number;
    nombre?: string;
    cantidad?: number; // default 1
    precio: { amount: number; currency?: string };
    costo: { amount: number; currency?: string };
    usarBase?: BaseProducto;
    clasificadores?: Array<{ type: string; id: string | number }>;
    tags?: string[];
  }>;
}
