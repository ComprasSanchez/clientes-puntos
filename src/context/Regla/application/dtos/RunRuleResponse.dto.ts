// src/context/Regla/application/dtos/ExecuteRulesResponse.dto.ts
export class ExecuteRulesResponseDto {
  debitAmount: number;
  credito?: { cantidad: number; expiraEn?: string }; // ISO date string
}
