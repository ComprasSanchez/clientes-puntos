// src/shared/infrastructure/typeorm/transformers/decimal-to-number.transformer.ts
import { ValueTransformer } from 'typeorm';

export const DecimalToNumberTransformer: ValueTransformer = {
  to: (value?: number | null) => value, // al escribir, ya es number
  from: (value?: string | null) =>
    value === null || value === undefined ? null : Number(value),
};
