import { ClienteTelefono } from '../../ValueObjects/ClienteTelefono';

describe('ClienteTelefono VO', () => {
  it('acepta 7–15 dígitos opcional +', () => {
    expect(() => new ClienteTelefono('1234567')).not.toThrow();
    expect(() => new ClienteTelefono('+541234567890')).not.toThrow();
  });

  it('lanza si demasiado corto o largo', () => {
    expect(() => new ClienteTelefono('123456')).toThrowError();
    expect(() => new ClienteTelefono('+123')).toThrowError();
  });

  it('acepta null (nullable)', () => {
    expect(() => new ClienteTelefono(null)).not.toThrow();
  });
});
