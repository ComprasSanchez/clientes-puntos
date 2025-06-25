// test/domain/value-objects/categoria-id.vo.spec.ts

import { CategoriaId } from '../../value-objects/CategoriaId';

describe('CategoriaId VO', () => {
  it('lanza si es vacío', () => {
    expect(() => new CategoriaId('')).toThrow(
      /no puede estar vacío, Es requerido/,
    );
  });
});
