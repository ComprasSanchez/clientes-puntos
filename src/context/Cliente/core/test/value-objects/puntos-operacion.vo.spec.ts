import { PuntosOperacion } from 'src/context/Cliente/core/value-objects/PuntosOperacion';

describe('PuntosOperacion VO', () => {
  it('acepta enteros positivos (> 0)', () => {
    expect(() => new PuntosOperacion(1)).not.toThrow();
    expect(() => new PuntosOperacion(50)).not.toThrow();
  });

  it('lanza si es cero', () => {
    expect(() => new PuntosOperacion(0)).toThrow(/Deb(en)? ser enteros > 0/);
  });

  it('lanza si es negativo', () => {
    expect(() => new PuntosOperacion(-5)).toThrow(/Deb(en)? ser enteros > 0/);
  });

  it('lanza si no es entero', () => {
    expect(() => new PuntosOperacion(2.7)).toThrow(/Deb(en)? ser enteros > 0/);
  });

  it('lanza si se le pasa null o undefined', () => {
    // @ts-expect-error prueba de runtime
    expect(() => new PuntosOperacion(null)).toThrow();
    // @ts-expect-error prueba de runtime
    expect(() => new PuntosOperacion(undefined)).toThrow();
  });
});
