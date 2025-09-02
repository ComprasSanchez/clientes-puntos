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
  return new ClienteEmail(String(v).trim());
}

export function safeTelefono(
  v: string | ClienteTelefono | null | undefined,
): ClienteTelefono {
  if (v instanceof ClienteTelefono) return v;
  if (isEmpty(v)) return new ClienteTelefono(null);
  return new ClienteTelefono(String(v).trim());
}

export function safeDireccion(
  v: string | ClienteDireccion | null | undefined,
): ClienteDireccion {
  if (v instanceof ClienteDireccion) return v;
  if (isEmpty(v)) return new ClienteDireccion(null);
  return new ClienteDireccion(String(v).trim());
}

export function safeCodigoPostal(
  v: string | number | ClienteCodigoPostal | null | undefined,
): ClienteCodigoPostal {
  if (v instanceof ClienteCodigoPostal) return v;
  if (isEmpty(v)) return new ClienteCodigoPostal(null);
  return new ClienteCodigoPostal(String(v).trim());
}

export function safeLocalidad(
  v: string | ClienteLocalidad | null | undefined,
): ClienteLocalidad {
  if (v instanceof ClienteLocalidad) return v;
  if (isEmpty(v)) return new ClienteLocalidad(null);
  return new ClienteLocalidad(String(v).trim());
}

export function safeProvincia(
  v: string | ClienteProvincia | null | undefined,
): ClienteProvincia {
  if (v instanceof ClienteProvincia) return v;
  if (isEmpty(v)) return new ClienteProvincia(null);
  return new ClienteProvincia(String(v).trim());
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
