import { OrigenOperacion } from '../../value-objects/OrigenOperacion';

describe('OrigenOperacion VO', () => {
  it('acepta y trimmea cadenas válidas', () => {
    const o = new OrigenOperacion('  origen  ');
    expect(o.value).toBe('origen');
    expect(o.toString()).toBe('origen');
  });

  it('lanza si se pasa cadena vacía o solo espacios', () => {
    expect(() => new OrigenOperacion('')).toThrow(/no puede estar vacío/);
    expect(() => new OrigenOperacion('   ')).toThrow(/no puede estar vacío/);
  });

  it('lanza si excede 50 caracteres', () => {
    const long = 'a'.repeat(51);
    expect(() => new OrigenOperacion(long)).toThrow(/excede 50 caracteres/);
  });
});
