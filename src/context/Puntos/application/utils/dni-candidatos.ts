const largoValido = (dni: string) => dni.length >= 6 && dni.length <= 10;

/** Formas en que puede estar guardado un DNI en Puntos (ej. 40772342 y 0040772342). */
export function candidatosDni(input?: string | null): string[] {
  const digitos = String(input ?? '').replace(/\D/g, '');
  if (!digitos) return [];
  const candidatos = new Set<string>();
  if (largoValido(digitos)) candidatos.add(digitos);
  const sinCeros = digitos.replace(/^0+/, '');
  if (largoValido(sinCeros)) {
    candidatos.add(sinCeros);
    candidatos.add(sinCeros.padStart(10, '0'));
  }
  return [...candidatos];
}
