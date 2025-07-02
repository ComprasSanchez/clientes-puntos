import { InvalidNumberFormatError } from '@shared/core/exceptions/InvalidNumberFormatError';
import { ReglaPrioridad } from '../../value-objects/ReglaPrioridad';

describe('ReglaPrioridad', () => {
  it('acepta enteros >= 1', () => {
    expect(new ReglaPrioridad(1).value).toBe(1);
  });

  it('lanza InvalidNumberFormatError si es negativo o no entero', () => {
    expect(() => new ReglaPrioridad(-1)).toThrow(InvalidNumberFormatError);
    expect(() => new ReglaPrioridad(1.5)).toThrow(InvalidNumberFormatError);
  });
});
