// core/reglas/dto/MoneyDTO.ts
export interface MoneyDTO {
  amount: number; // siempre número liso
  currency?: string; // opcional: ISO 4217 o tu código interno
}
