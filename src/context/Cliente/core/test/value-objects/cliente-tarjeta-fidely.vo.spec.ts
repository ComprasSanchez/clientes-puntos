import { ClienteTarjetaFidely } from '../../ValueObjects/ClienteTarjetaFidely';

describe('ClienteTarjetaFidely VO', () => {
  it('acepta hasta 16 dígitos', () => {
    expect(() => new ClienteTarjetaFidely('1234')).not.toThrow();
    expect(() => new ClienteTarjetaFidely('1234567890123456')).not.toThrow();
  });

  it('lanza si supera 16 dígitos o contiene letras', () => {
    expect(() => new ClienteTarjetaFidely('12345678901234567')).toThrow();
    expect(() => new ClienteTarjetaFidely('1234ABCD')).toThrow();
  });

  it('acepta null (nullable)', () => {
    expect(() => new ClienteTarjetaFidely(null)).not.toThrow();
  });
});
