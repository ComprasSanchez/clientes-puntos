import { ClienteDireccion } from '../../value-objects/ClienteDireccion';

describe('ClienteDireccion VO', () => {
  it('acepta direcciones de al menos 5 caracteres', () => {
    expect(() => new ClienteDireccion('Calle Falsa 123')).not.toThrow();
  });

  it('lanza si es demasiado corta', () => {
    expect(() => new ClienteDireccion('Av 1')).toThrow();
  });

  it('acepta null (nullable)', () => {
    expect(() => new ClienteDireccion(null)).not.toThrow();
    expect(new ClienteDireccion(null).value).toBeNull();
  });
});
