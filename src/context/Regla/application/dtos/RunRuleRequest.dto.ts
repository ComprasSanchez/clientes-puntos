// @regla/application/dtos/ExecuteRulesRequest.dto.ts
export class ExecuteRulesRequestDto {
  clienteId: string;
  tipo: string;
  fecha: Date; // ISO date string
  puntosSolicitados?: number;
  monto?: number;
  moneda?: string;
  saldoActual: number;
}
