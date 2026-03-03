import { OpTipo } from '@shared/core/enums/OpTipo';
import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';
import {
  buildDailySeries,
  buildRanges,
  buildWeeklySeries,
  getISOWeek,
} from 'src/context/Metricas/application/clientes/services/helpers/MetricasClienteHelpers';

function m(
  id: string,
  fechaIso: string,
  pesosAhorro: number,
  puntosAdquiridos: number,
): ClienteMetrica {
  return new ClienteMetrica(
    id,
    'cliente-1',
    new Date(fechaIso),
    pesosAhorro,
    puntosAdquiridos,
    OpTipo.COMPRA,
  );
}

describe('MetricasClienteHelpers', () => {
  it('calcula rangos predefinidos y max segun la fecha minima', () => {
    const now = new Date('2026-03-01T12:00:00.000Z');
    const metricas = [
      m('1', '2026-02-28T14:00:00.000Z', 100, 10),
      m('2', '2026-02-25T10:00:00.000Z', 200, 20),
      m('3', '2025-11-15T10:00:00.000Z', 300, 30),
    ];

    const ranges = buildRanges(metricas, now);

    expect(ranges['1d'].operaciones).toBe(1);
    expect(ranges['7d'].operaciones).toBe(2);
    expect(ranges['7d'].pesosAhorro).toBe(300);
    expect(ranges.max.from).toBe('2025-11-15T10:00:00.000Z');
    expect(ranges.max.to).toBe('2026-03-01T12:00:00.000Z');
    expect(ranges.max.operaciones).toBe(3);
  });

  it('agruppa por dia y acumula montos', () => {
    const metricas = [
      m('1', '2026-02-28T01:00:00.000Z', 100, 10),
      m('2', '2026-02-28T22:00:00.000Z', 300, 30),
      m('3', '2026-03-01T03:00:00.000Z', 50, 5),
    ];

    const serie = buildDailySeries(metricas);

    expect(serie).toHaveLength(2);
    expect(serie[0].bucket).toBe('2026-02-28');
    expect(serie[0].pesosAhorro).toBe(400);
    expect(serie[0].puntosAdquiridos).toBe(40);
    expect(serie[0].operaciones).toBe(2);
    expect(serie[1].bucket).toBe('2026-03-01');
  });

  it('agruppa por semana ISO de forma consistente', () => {
    const metricas = [
      m('1', '2025-12-31T10:00:00.000Z', 100, 10),
      m('2', '2026-01-01T10:00:00.000Z', 200, 20),
      m('3', '2026-01-10T10:00:00.000Z', 50, 5),
    ];

    const serie = buildWeeklySeries(metricas);

    expect(serie.length).toBeGreaterThan(1);
    const isoWeek = getISOWeek(new Date('2026-01-01T10:00:00.000Z'));
    expect(isoWeek.week).toBeGreaterThanOrEqual(1);
    expect(isoWeek.week).toBeLessThanOrEqual(53);
  });
});
