import { SaldoActual } from 'src/context/Cliente/core/value-objects/SaldoActual';

describe('SaldoActual VO', () => {
  it('acepta cero como saldo inicial válido', () => {
    expect(() => new SaldoActual(0)).not.toThrow();
    const vo = new SaldoActual(0);
    expect(vo.value).toBe(0);
  });

  it('acepta enteros positivos', () => {
    expect(() => new SaldoActual(1)).not.toThrow();
    expect(() => new SaldoActual(100)).not.toThrow();
  });

  it('lanza si es un número negativo', () => {
    expect(() => new SaldoActual(-1)).toThrow(/Debe ser entero ≥ 0/);
  });

  it('lanza si no es un entero', () => {
    expect(() => new SaldoActual(1.5)).toThrow(/Debe ser entero ≥ 0/);
  });

  it('lanza si se le pasa null o undefined', () => {
    // @ts-expect-error prueba de runtime
    expect(() => new SaldoActual(null)).toThrow();
    // @ts-expect-error prueba de runtime
    expect(() => new SaldoActual(undefined)).toThrow();
  });
  it('lanza si se le pasa un string', () => {
    // @ts-expect-error prueba de runtime
    expect(() => new SaldoActual('100')).toThrow(/Debe ser entero ≥ 0/);
  });

  it('lanza si se le pasa un objeto', () => {
    // @ts-expect-error prueba de runtime
    expect(() => new SaldoActual({})).toThrow(/Debe ser entero ≥ 0/);
  });
});
