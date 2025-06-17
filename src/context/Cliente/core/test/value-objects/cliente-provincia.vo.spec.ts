import { ClienteProvincia } from '../../value-objects/ClienteProvincia';

describe('ClienteProvincia VO', () => {
  it('acepta nombres válidos', () => {
    expect(() => new ClienteProvincia('Córdoba')).not.toThrow();
  });

  it('lanza en caso inválido', () => {
    expect(() => new ClienteProvincia('córdoba')).toThrow();
    expect(() => new ClienteProvincia('123Provincia')).toThrow();
  });

  it('acepta null (nullable)', () => {
    expect(() => new ClienteProvincia(null)).not.toThrow();
  });
});
