import { ClienteCategoria } from '../../value-objects/ClienteCategoria';

describe('ClienteCategoria VO', () => {
  it('acepta categorías de letras entre 2 y 20 caracteres', () => {
    expect(() => new ClienteCategoria('Gold')).not.toThrow();
    expect(() => new ClienteCategoria('Mi Categoría')).not.toThrow();
  });

  it('lanza si es vacía o demasiado corta', () => {
    expect(() => new ClienteCategoria('')).toThrow();
    expect(() => new ClienteCategoria('A')).toThrow();
  });

  it('lanza si contiene números o supera 20 caracteres', () => {
    expect(() => new ClienteCategoria('Cat3goría')).toThrow();
    expect(() => new ClienteCategoria('a'.repeat(21))).toThrow();
  });
});
