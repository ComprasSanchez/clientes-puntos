// @regla/application/dtos/ExecuteRulesResponse.dto.ts
export class ExecuteRulesResponseDto {
  debitAmount: number;
  credito?: { cantidad: number; expiraEn?: Date }; // ISO date string
}
