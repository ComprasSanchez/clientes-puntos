import { MaxLengthRequiredError } from '@shared/core/exceptions/MaxLengthRequiredError';
import { ReglaDescripcion } from '../../value-objects/ReglaDescripcion';

describe('ReglaDescripcion', () => {
  it('no lanza si es undefined', () => {
    expect(() => new ReglaDescripcion()).not.toThrow();
  });

  it('acepta una descripción válida', () => {
    expect(() => new ReglaDescripcion('Descripción ok')).not.toThrow();
  });

  it('lanza MaxLengthRequiredError si > 200 caracteres', () => {
    const long = 'x'.repeat(201);
    expect(() => new ReglaDescripcion(long)).toThrow(MaxLengthRequiredError);
  });
});
