// shared/infrastructure/transformers/decimal-to-number.transformer.ts
import { ValueTransformer } from 'typeorm';

export class DecimalToNumberTransformer implements ValueTransformer {
  to(value?: number | null): any {
    if (value === null || value === undefined) return null;
    return value; // TypeORM lo serializa
  }
  from(value?: string | number | null): number {
    if (value === null || value === undefined) return 0;
    const n =
      typeof value === 'number'
        ? value
        : Number(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : 0; // evita NaN
  }
}
