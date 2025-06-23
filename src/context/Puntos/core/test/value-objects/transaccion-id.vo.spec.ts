import { TransaccionId } from '../../value-objects/TransaccionId';

describe('TransaccionId VO', () => {
  it('lanza si es cadena vacía', () => {
    expect(() => new TransaccionId('')).toThrow(/no puede estar vacío/);
  });
});
