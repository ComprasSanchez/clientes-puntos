import { BaseReglaDTO } from './ReglaDTO';

// src/context/Regla/core/entities/ConversionRuleDTO.ts
export interface ConversionRuleDTO extends BaseReglaDTO {
  rateAccred: { value: number };
  rateSpend: { value: number };
  creditExpiryDays?: { value: number };
}
