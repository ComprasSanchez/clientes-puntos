import { LoteId } from '../../value-objects/LoteId';

describe('LoteId VO', () => {
  it('lanza si es cadena vacía', () => {
    expect(() => new LoteId('')).toThrow(/no puede estar vacío/);
  });
});
