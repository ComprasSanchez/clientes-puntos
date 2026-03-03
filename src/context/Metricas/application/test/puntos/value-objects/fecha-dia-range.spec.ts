import { FechaDiaRange } from 'src/context/Metricas/application/puntos/value-objects/FechaDiaRange';

describe('FechaDiaRange', () => {
  it('crea rango valido cuando start < end', () => {
    const start = new Date('2026-03-01T00:00:00.000Z');
    const end = new Date('2026-03-01T23:59:59.999Z');

    const range = new FechaDiaRange(start, end);

    expect(range.startUtc).toBe(start);
    expect(range.endUtc).toBe(end);
  });

  it('lanza error cuando start no es fecha valida', () => {
    const invalid = new Date('invalid');
    const end = new Date('2026-03-01T23:59:59.999Z');

    expect(() => new FechaDiaRange(invalid, end)).toThrow('startUtc inválido');
  });

  it('lanza error cuando start >= end', () => {
    const start = new Date('2026-03-01T23:59:59.999Z');
    const end = new Date('2026-03-01T00:00:00.000Z');

    expect(() => new FechaDiaRange(start, end)).toThrow(
      'Rango de fechas inválido: start >= end',
    );
  });
});
