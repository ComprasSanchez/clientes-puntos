// src/infrastructure/auth/extract-sucursal-id.ts
export function extractSucursalIdFromGroups(
  groups: string[] | undefined,
): string | undefined {
  if (!Array.isArray(groups)) return undefined;

  // 1) Busca un path del tipo /sucursales-puntos/<codigo>
  const matchPath = groups.find((g) =>
    /^\/sucursales-puntos\/[\w-]+$/i.test(g),
  );
  if (!matchPath) return undefined;

  // 2) Toma la última parte del path (el código)
  const code = matchPath.split('/').pop() || '';

  return code;
}
