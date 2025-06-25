import { CantidadPuntos } from '../../value-objects/CantidadPuntos';

describe('CantidadPuntos VO', () => {
  it('acepta cero y enteros positivos', () => {
    expect(() => new CantidadPuntos(0)).not.toThrow();
    expect(new CantidadPuntos(0).value).toBe(0);
    expect(() => new CantidadPuntos(10)).not.toThrow();
    expect(new CantidadPuntos(10).value).toBe(10);
  });

  it('trunca decimales con Math.floor', () => {
    const cp = new CantidadPuntos(5.9);
    expect(cp.value).toBe(5);
  });

  it('lanza si es null o NaN', () => {
    // @ts-expect-error prueba runtime
    expect(() => new CantidadPuntos(null)).toThrow(
      /Debe ser un número entero válido/,
    );
    expect(() => new CantidadPuntos(NaN)).toThrow(
      /Debe ser un número entero válido/,
    );
  });

  it('lanza si es negativo', () => {
    expect(() => new CantidadPuntos(-1)).toThrow(/Debe ser un entero >= 0/);
  });

  it('toNumber devuelve el valor numérico', () => {
    const cp = new CantidadPuntos(7);
    expect(cp.toNumber()).toBe(7);
  });
});
