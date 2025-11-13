export function normalizeWordsTitleCase(raw: string): string {
  return raw
    .trim()
    .toLocaleLowerCase('es-AR')
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase('es-AR') + w.slice(1))
    .join(' ');
}
