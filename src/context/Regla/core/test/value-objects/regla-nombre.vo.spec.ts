import { FieldRequiredError } from 'src/shared/core/exceptions/FieldRequiredError';
import { MinLengthRequiredError } from 'src/shared/core/exceptions/MinLengthRequiredError';
import { MaxLengthRequiredError } from 'src/shared/core/exceptions/MaxLengthRequiredError';
import { ReglaNombre } from '../../value-objects/ReglaNombre';

describe('ReglaNombre', () => {
  it('debe crear un nombre válido y hacer trim', () => {
    const nombre = new ReglaNombre('  Regla X  ');
    expect(nombre.value).toBe('Regla X');
  });

  it('lanza FieldRequiredError si es vacío', () => {
    expect(() => new ReglaNombre('')).toThrow(FieldRequiredError);
  });

  it('lanza MinLengthRequiredError si < 2 caracteres', () => {
    expect(() => new ReglaNombre('A')).toThrow(MinLengthRequiredError);
  });

  it('lanza MaxLengthRequiredError si > 20 caracteres', () => {
    const long = 'x'.repeat(21);
    expect(() => new ReglaNombre(long)).toThrow(MaxLengthRequiredError);
  });
});
