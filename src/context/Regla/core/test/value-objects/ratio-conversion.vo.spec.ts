import { InvalidNumberFormatError } from '@shared/core/exceptions/InvalidNumberFormatError';
import { RatioConversion } from '../../value-objects/RatioConversion';

describe('RatioConversion', () => {
  it('debe aceptar 1 o mayor', () => {
    expect(new RatioConversion(1).value).toBe(1);
    expect(new RatioConversion(2.5).value).toBe(2.5);
  });

  it('lanza InvalidNumberFormatError si < 1', () => {
    expect(() => new RatioConversion(0.9)).toThrow(InvalidNumberFormatError);
  });

  it('lanza InvalidNumberFormatError si es 0', () => {
    expect(() => new RatioConversion(0)).toThrow(InvalidNumberFormatError);
  });
});
