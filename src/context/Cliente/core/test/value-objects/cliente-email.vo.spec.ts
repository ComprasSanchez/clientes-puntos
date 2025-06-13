import { ClienteEmail } from '../../ValueObjects/ClienteEmail';

describe('ClienteEmail VO', () => {
  it('acepta email válido', () => {
    expect(() => new ClienteEmail('usuario@dominio.com')).not.toThrow();
  });

  it('lanza si formato inválido', () => {
    expect(() => new ClienteEmail('usuario@')).toThrow();
  });

  it('acepta null (nullable)', () => {
    expect(() => new ClienteEmail(null)).not.toThrow();
  });
});
