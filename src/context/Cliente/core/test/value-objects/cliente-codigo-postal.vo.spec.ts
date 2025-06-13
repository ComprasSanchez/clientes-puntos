import { ClienteCodigoPostal } from '../../ValueObjects/ClienteCodPostal';

describe('ClienteCodigoPostal VO', () => {
  it('acepta códigos de 4 a 6 dígitos', () => {
    expect(() => new ClienteCodigoPostal('1234')).not.toThrow();
    expect(() => new ClienteCodigoPostal('123456')).not.toThrow();
  });

  it('lanza si no son 4–6 dígitos o contiene letras', () => {
    expect(() => new ClienteCodigoPostal('123')).toThrow();
    expect(() => new ClienteCodigoPostal('1234567')).toThrow();
    expect(() => new ClienteCodigoPostal('12A34')).toThrow();
  });
});
