import { ClienteNombre } from '../../value-objects/ClienteNombre';

describe('ClienteNombre VO', () => {
  it('acepta nombre simple con mayúscula inicial', () => {
    expect(() => new ClienteNombre('Juan')).not.toThrow();
  });

  it('acepta nombre compuesto', () => {
    expect(() => new ClienteNombre('María José')).not.toThrow();
  });

  it('lanza si tiene números o caracteres inválidos', () => {
    expect(() => new ClienteNombre('Ju4n')).toThrow();
    expect(() => new ClienteNombre('juan')).toThrow();
  });

  it('lanza si es muy corto', () => {
    expect(() => new ClienteNombre('J')).toThrow(/al menos 2 caracteres/);
  });
});
