// core/reglas/utils/number-helpers.ts
import { MoneyDTO } from '../dto/MoneyDTO';

/** Type guard: ¿tiene la propiedad con un número? */
function hasNumberProp<T extends string>(
  obj: unknown,
  key: T,
): obj is Record<T, number> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    key in obj &&
    typeof (obj as Record<T, unknown>)[key] === 'number'
  );
}

/** Type guard: ¿tiene la propiedad con un string? */
function hasStringProp<T extends string>(
  obj: unknown,
  key: T,
): obj is Record<T, string> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    key in obj &&
    typeof (obj as Record<T, unknown>)[key] === 'string'
  );
}

/** Convierte MoneyDTO|number a number de forma segura (sin any). */
export function numberFromMoney(
  m: MoneyDTO | number | null | undefined,
): number {
  if (typeof m === 'number') return m;
  if (hasNumberProp(m, 'amount')) return m.amount;
  return 0; // fallback seguro
}

/** Obtiene el código de moneda si existe (currency|moneda|code) sin usar any. */
export function currencyFromMoney(m?: unknown): string | undefined {
  if (hasStringProp(m, 'currency')) return m.currency;
  if (hasStringProp(m, 'moneda')) return m.moneda; // alias común
  if (hasStringProp(m, 'code')) return m.code; // alias común
  return undefined;
}
