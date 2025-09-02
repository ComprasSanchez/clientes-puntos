import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';

export class ClienteNombre {
  readonly value: string;
  private static readonly ALLOWED = /^[\p{L}\p{M}\p{Pd} .'’]+$/u;

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
    const normalized = ClienteNombre.normalize(raw);
    this.ensureValid(normalized);
    this.value = normalized;
  }

  private static normalize(input: string): string {
    if (!input) return '';

    // 1) Normaliza Unicode
    let s = input.normalize('NFC');
    s = s.replace(/[\p{Cf}\p{Cc}]+/gu, ''); // quita ZWSP, BOM, etc.
    s = s.replace(/\p{Zs}+/gu, ' ').trim(); // todo espacio Unicode → " "

    // 4) Title Case con excepciones, preservando guiones y apóstrofes
    s = s
      .split(' ')
      .map((word) =>
        word
          .split(/([\\-–—'’])/u) // conserva separadores
          .map((part) => {
            if (/^[\\-–—'’]$/u.test(part)) return part;
            const lw = part.toLowerCase();
            if (ClienteNombre.LOWER_KEEP.has(lw)) return lw;
            return lw ? lw[0].toUpperCase() + lw.slice(1) : '';
          })
          .join(''),
      )
      .join(' ');

    return s;
  }

  private ensureValid(s: string) {
    if (!s) throw new FieldRequiredError('Nombre');
    if (s.length > 50) {
      throw new MaxLengthRequiredError('Nombre', 50, s.length);
    }
    if (!ClienteNombre.ALLOWED.test(s)) {
      throw new InvalidFormatError(s);
    }
  }

  toString() {
    return this.value;
  }
}
