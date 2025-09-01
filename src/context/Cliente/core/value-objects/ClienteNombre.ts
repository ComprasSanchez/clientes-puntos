import { FieldRequiredError } from '@shared/core/exceptions/FieldRequiredError';
import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { MinLengthRequiredError } from '@shared/core/exceptions/MinLengthRequiredError';

export class ClienteNombre {
  readonly value: string;

  private static readonly ALLOWED = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü' -]+$/;
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
    // Normaliza Unicode y espacios
    let s = input.normalize('NFC').trim().replace(/\s+/g, ' ');

    // Title Case con excepciones (de/del/la/… en minúsculas)
    s = s
      .split(' ')
      .map((word) =>
        word
          .split(/([-'])/) // conserva guiones y apóstrofes
          .map((part) => {
            if (part === '-' || part === "'") return part;
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
    if (s.length < 2) throw new MinLengthRequiredError('Nombre', 2, s.length);
    if (!ClienteNombre.ALLOWED.test(s)) throw new InvalidFormatError(s);
  }
}
