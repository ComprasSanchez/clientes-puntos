import { ReferenciaMovimiento } from '../../value-objects/ReferenciaMovimiento';

describe('ReferenciaMovimiento VO', () => {
  it('acepta cadena no vacía y la trimmea', () => {
    const r = new ReferenciaMovimiento('  ref123  ');
    expect(r.value).toBe('ref123');
    expect(r.toString()).toBe('ref123');
  });

  it('lanza si es null, undefined, vacía o solo espacios', () => {
    expect(() => new ReferenciaMovimiento(null)).toThrow(
      /no puede estar vacía/,
    );
    expect(() => new ReferenciaMovimiento(undefined)).toThrow(
      /no puede estar vacía/,
    );
    expect(() => new ReferenciaMovimiento('')).toThrow(/no puede estar vacía/);
    expect(() => new ReferenciaMovimiento('   ')).toThrow(
      /no puede estar vacía/,
    );
  });

  it('lanza si excede 100 caracteres', () => {
    const long = 'x'.repeat(101);
    expect(() => new ReferenciaMovimiento(long)).toThrow(
      /excede 100 caracteres/,
    );
  });
});
