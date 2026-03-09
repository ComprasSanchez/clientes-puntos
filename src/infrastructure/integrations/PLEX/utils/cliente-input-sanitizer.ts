const PLACEHOLDERS = new Set([
  '*',
  '-',
  '.',
  'N/A',
  'NA',
  'S/D',
  'SD',
  'NULL',
  '(NULL)',
]);

function fixMojibake(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/Â/g, '')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã‘/g, 'Ñ')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ãœ/g, 'Ü');
}

export function normalizeOptionalText(raw?: string): string | undefined {
  if (raw == null) return undefined;
  const cleaned = fixMojibake(raw).replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  if (PLACEHOLDERS.has(cleaned.toUpperCase())) return undefined;
  return cleaned;
}

export function normalizeNameLike(raw?: string): string | undefined {
  const cleaned = normalizeOptionalText(raw);
  if (!cleaned) return undefined;
  const withoutStars = cleaned.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  return withoutStars || undefined;
}

export function normalizePhone(raw?: string): string | undefined {
  const cleaned = normalizeOptionalText(raw);
  if (!cleaned) return undefined;

  const compact = cleaned.replace(/[^0-9+]/g, '');
  return /^\+?[0-9]{7,15}$/.test(compact) ? compact : undefined;
}

export function normalizePostalCode(raw?: string): string | undefined {
  const cleaned = normalizeOptionalText(raw);
  if (!cleaned) return undefined;
  return /^\d{4,6}$/.test(cleaned) ? cleaned : undefined;
}

export function normalizeSexo(raw?: string): string | undefined {
  const cleaned = normalizeOptionalText(raw);
  if (!cleaned) return undefined;

  const upper = cleaned.toUpperCase();
  if (upper === 'M' || upper === 'F' || upper === 'N' || upper === 'X') {
    return upper;
  }
  return undefined;
}
