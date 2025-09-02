import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';

export class ClienteApellido {
  readonly value: string;

  // Solo letras (incluye acentos/ñ/ü), espacios, guiones y apóstrofes
  private static readonly ALLOWED = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü' -]+$/;

  // Palabras que se mantienen en minúsculas
  private static readonly LOWER_KEEP = new Set([
    'de',
    'del',
    'la',
    'las',
    'los',
    'y',
    'da',
    'di',
    'do',
    'du',
    'van',
    'von',
    'san',
    'santa',
  ]);

  constructor(raw: string) {
    const normalized = ClienteApellido.normalize(raw);
    this.ensureValid(normalized);
    this.value = normalized;
  }

  private static normalize(input: string): string {
    if (!input) return '';
    // Normaliza unicode, recorta y colapsa espacios
    let s = input.normalize('NFC').trim().replace(/\s+/g, ' ');

    // Title Case con excepciones; preserva guiones y apóstrofes por sub-partes
    s = s
      .split(' ')
      .map((word) =>
        word
          .split(/([-'])/) // mantiene '-' y '\'' como separadores conservados
          .map((part) => {
            if (part === '-' || part === "'") return part;
            const lw = part.toLowerCase();
            if (ClienteApellido.LOWER_KEEP.has(lw)) return lw;
            return lw ? lw[0].toUpperCase() + lw.slice(1) : '';
          })
          .join(''),
      )
      .join(' ');

    return s;
  }

  private ensureValid(s: string) {
    if (!s) {
      throw new FieldRequiredError('Apellido');
    }
    if (s.length > 50) {
      throw new MaxLengthRequiredError('Apellido', 50, s.length);
    }
    if (!ClienteApellido.ALLOWED.test(s)) {
      throw new InvalidFormatError(s);
    }
  }
}
