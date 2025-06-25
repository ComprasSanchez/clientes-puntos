import { ReferenciaMovimiento } from '../../value-objects/ReferenciaMovimiento';

describe('ReferenciaMovimiento VO', () => {
  it('acepta cadena no vacía y la trimmea', () => {
    const r = new ReferenciaMovimiento('  ref123  ');
    expect(r.value).toBe('ref123');
    expect(r.toString()).toBe('ref123');
  });

  it('lanza si excede 100 caracteres', () => {
    const long = 'x'.repeat(101);
    expect(() => new ReferenciaMovimiento(long)).toThrow(
      /Debe tener un máximo de 100 carácteres/,
    );
  });
});
