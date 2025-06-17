import { ClienteDni } from '../../value-objects/ClienteDni';

describe('ClienteDni VO', () => {
  it('acepta DNI válido', () => {
    expect(() => new ClienteDni('12345678')).not.toThrow();
  });

  it('lanza si no cumple formato 7 a 10 digitos', () => {
    expect(() => new ClienteDni('1234A6')).toThrow();
    expect(() => new ClienteDni('12345678901')).toThrow();
  });
});
