export const toInt = (v: unknown): number | undefined => {
  if (typeof v === 'number')
    return Number.isFinite(v) ? Math.trunc(v) : undefined;
  if (typeof v === 'string') {
    const s = v.trim().replace(',', '.');
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  }
  return undefined;
};

export const toDec = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const s = v.trim().replace(',', '.');
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};
