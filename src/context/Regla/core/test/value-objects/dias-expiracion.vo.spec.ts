import { InvalidNumberFormatError } from '@shared/core/exceptions/InvalidNumberFormatError';
import { DiasExpiracion } from '../../value-objects/DiasExpiracion';

describe('DiasExpiracion', () => {
  it('debe aceptar valores positivos', () => {
    const v = new DiasExpiracion(5);
    expect(v.value).toBe(5);
  });

  it('lanza InvalidNumberFormatError si es negativo', () => {
    expect(() => new DiasExpiracion(-1)).toThrow(InvalidNumberFormatError);
  });
});
