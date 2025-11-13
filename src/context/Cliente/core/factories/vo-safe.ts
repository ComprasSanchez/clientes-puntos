// @cliente/core/factories/vo-safe.ts
import { ClienteFechaNacimiento } from '../value-objects/ClienteFechaNacimiento';
import { ClienteEmail } from '../value-objects/ClienteEmail';
import { ClienteTelefono } from '../value-objects/ClienteTelefono';
import { ClienteDireccion } from '../value-objects/ClienteDireccion';
import { ClienteCodigoPostal } from '../value-objects/ClienteCodPostal';
import { ClienteLocalidad } from '../value-objects/ClienteLocalidad';
import { ClienteProvincia } from '../value-objects/ClienteProvincia';
import { ClienteIdFidely } from '../value-objects/ClienteIdFidely';
import { ClienteTarjetaFidely } from '../value-objects/ClienteTarjetaFidely';

// === Null / Empty helpers
const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// === Fecha de nacimiento (VO o null)
export function safeFechaNacimiento(
  v: Date | string | ClienteFechaNacimiento | null | undefined,
): ClienteFechaNacimiento | null {
  if (v instanceof ClienteFechaNacimiento) return v;
  if (isEmpty(v)) return null;
  return new ClienteFechaNacimiento(v as Date | string); // el VO ya admite null y valida fechas
}

// === Opcionales que se modelan como VO "nullable" internamente
export function safeEmail(
  v: string | ClienteEmail | null | undefined,
): ClienteEmail {
  if (v instanceof ClienteEmail) return v;
  if (isEmpty(v)) return new ClienteEmail(null);

  const emailRegexStricto =
    /^(?!.*\.\.)([A-Za-z0-9]+(?:[._%+-]?[A-Za-z0-9]+)*)@(?!-)[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?:\.[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)+$/;

  const str = String(v).trim();

  if (!emailRegexStricto.test(str)) {
    // en vez de tirar error, lo consideramos null
    return new ClienteEmail(null);
  }

  return new ClienteEmail(str);
}

export function safeTelefono(
  v: string | ClienteTelefono | null | undefined,
): ClienteTelefono {
  if (v instanceof ClienteTelefono) return v;
  if (isEmpty(v)) return new ClienteTelefono(null);

  const telefonoRegex = /^\+?[0-9]{7,15}$/;
  const str = String(v).trim();

  if (!telefonoRegex.test(str)) {
    // dato inválido => lo guardamos como null para no romper
    return new ClienteTelefono(null);
  }

  return new ClienteTelefono(str);
}

export function safeDireccion(
  v: string | ClienteDireccion | null | undefined,
): ClienteDireccion {
  if (v instanceof ClienteDireccion) return v;
  if (isEmpty(v)) return new ClienteDireccion(null);

  const str = String(v).trim();

  try {
    return new ClienteDireccion(str);
  } catch {
    // Si no pasa las validaciones del VO (min/max length), lo dejamos en null
    return new ClienteDireccion(null);
  }
}

export function safeCodigoPostal(
  v: string | number | ClienteCodigoPostal | null | undefined,
): ClienteCodigoPostal {
  if (v instanceof ClienteCodigoPostal) return v;
  if (isEmpty(v)) return new ClienteCodigoPostal(null);

  const str = String(v).trim();

  try {
    return new ClienteCodigoPostal(str);
  } catch {
    // si el código postal es inválido según el VO, lo seteamos en null
    return new ClienteCodigoPostal(null);
  }
}

export function safeLocalidad(
  v: string | ClienteLocalidad | null | undefined,
): ClienteLocalidad {
  if (v instanceof ClienteLocalidad) return v;
  if (isEmpty(v)) return new ClienteLocalidad(null);

  const raw = String(v).trim();
  const normalized = toTitleCase(raw); // "CORDOBA CAPITAL" => "Cordoba Capital"

  try {
    return new ClienteLocalidad(normalized);
  } catch {
    // Si la regex del VO igual no lo acepta, lo guardamos como null para no romper
    return new ClienteLocalidad(null);
  }
}

export function safeProvincia(
  v: string | ClienteProvincia | null | undefined,
): ClienteProvincia {
  if (v instanceof ClienteProvincia) return v;
  if (isEmpty(v)) return new ClienteProvincia(null);

  const raw = String(v).trim();
  const normalized = toTitleCase(raw);

  try {
    return new ClienteProvincia(normalized);
  } catch {
    // Si sigue siendo inválido según el VO, lo dejamos en null
    return new ClienteProvincia(null);
  }
}

// === Fidely (si querés tratarlos de forma homogénea)
export function safeIdFidely(
  v: string | number | ClienteIdFidely | null | undefined,
): ClienteIdFidely {
  if (v instanceof ClienteIdFidely) return v;
  if (isEmpty(v)) return new ClienteIdFidely(undefined); // tu VO ya manejaba undefined/null
  return new ClienteIdFidely(Number(v));
}

export function safeTarjetaFidely(
  v: string | number | ClienteTarjetaFidely | null | undefined,
): ClienteTarjetaFidely {
  if (v instanceof ClienteTarjetaFidely) return v;
  return new ClienteTarjetaFidely(String(v).trim());
}
