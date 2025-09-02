import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';

export class ClienteApellido {
  readonly value: string;

  // Letras Unicode (\p{L}\p{M}), espacios, apóstrofes recto/curly y guiones comunes/Unicode
  private static readonly ALLOWED = /^[\p{L}\p{M}\p{Pd} '’]+$/u;

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
    let s = input.normalize('NFC').trim().replace(/\s+/g, ' ');

    s = s
      .split(' ')
      .map((word) =>
        word
          .split(/([--–—'’])/u)
          .map((part) => {
            if (/^[--–—'’]$/u.test(part)) return part;
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
    if (!s) throw new FieldRequiredError('Apellido');
    if (s.length > 50) {
      throw new MaxLengthRequiredError('Apellido', 50, s.length);
    }
    if (!ClienteApellido.ALLOWED.test(s)) {
      throw new InvalidFormatError(s);
    }
  }

  toString() {
    return this.value;
  }
}
