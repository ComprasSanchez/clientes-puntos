import { ClienteLocalidad } from '../../ValueObjects/ClienteLocalidad';

describe('ClienteLocalidad VO', () => {
  it('acepta nombres válidos con mayúscula inicial', () => {
    expect(() => new ClienteLocalidad('Buenos Aires')).not.toThrow();
  });

  it('lanza si empieza con minúscula o contiene dígitos', () => {
    expect(() => new ClienteLocalidad('buenos Aires')).toThrow();
    expect(() => new ClienteLocalidad('City123')).toThrow();
  });

  it('acepta null (nullable)', () => {
    expect(() => new ClienteLocalidad(null)).not.toThrow();
    expect(new ClienteLocalidad(null).value).toBeNull();
  });
});
