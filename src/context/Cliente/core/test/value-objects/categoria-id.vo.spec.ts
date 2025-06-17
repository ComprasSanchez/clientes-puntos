// test/domain/value-objects/categoria-id.vo.spec.ts

import { CategoriaId } from '../../value-objects/CategoriaId';

describe('CategoriaId VO', () => {
  it('acepta un UUID v4 válido', () => {
    expect(
      () => new CategoriaId('00000000-0000-4000-8000-000000000000'),
    ).not.toThrow();
  });

  it('lanza si es vacío', () => {
    expect(() => new CategoriaId('')).toThrow(/no puede ser vacío/);
  });
});
