// src/context/Metricas/application/clientes/utils/cliente-metricas-helpers.ts

import { ClienteMetrica } from 'src/context/Metricas/core/clientes/entities/ClienteMetrica';
import {
  RangeSummaryDto,
  TimeRangeKey,
  TimeSeriesPointDto,
} from '../../dto/ClienteMetricasDTO';

// --------------------------------------------------------
// RANGOS
// --------------------------------------------------------

export function buildRanges(
  metricas: ClienteMetrica[],
  now: Date,
): Record<TimeRangeKey, RangeSummaryDto> {
  const maxRange = getMaxRange(metricas, now);

  const rangesDef: { key: TimeRangeKey; from: Date; to: Date }[] = [
    { key: '1d', from: subDays(now, 1), to: now },
    { key: '7d', from: subDays(now, 7), to: now },
    { key: '1m', from: subMonths(now, 1), to: now },
    { key: '3m', from: subMonths(now, 3), to: now },
    { key: '6m', from: subMonths(now, 6), to: now },
    { key: '1y', from: subYears(now, 1), to: now },
    { key: 'max', from: maxRange.from, to: maxRange.to },
  ];

  const result: Partial<Record<TimeRangeKey, RangeSummaryDto>> = {};

  for (const range of rangesDef) {
    const subset = filterByRange(metricas, range.from, range.to);
    result[range.key] = {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      pesosAhorro: sumPesos(subset),
      puntosAdquiridos: sumPuntos(subset),
      operaciones: subset.length,
    };
  }

  return result as Record<TimeRangeKey, RangeSummaryDto>;
}

export function getMaxRange(
  metricas: ClienteMetrica[],
  now: Date,
): { from: Date; to: Date } {
  if (metricas.length === 0) {
    // Si no hay métricas, devolvemos último año por defecto
    const from = subYears(now, 1);
    return { from, to: now };
  }

  const minDate = metricas.reduce(
    (min, m) => (m.fecha < min ? m.fecha : min),
    metricas[0].fecha,
  );

  return { from: minDate, to: now };
}

export function filterByRange(
  metricas: ClienteMetrica[],
  from: Date,
  to: Date,
): ClienteMetrica[] {
  return metricas.filter((m) => m.fecha >= from && m.fecha <= to);
}

export function sumPesos(metricas: ClienteMetrica[]): number {
  return metricas.reduce((acc, m) => acc + m.pesosAhorro, 0);
}

export function sumPuntos(metricas: ClienteMetrica[]): number {
  return metricas.reduce((acc, m) => acc + m.puntosAdquiridos, 0);
}

// --------------------------------------------------------
// Series (día / semana / mes)
// --------------------------------------------------------

export function buildDailySeries(
  metricas: ClienteMetrica[],
): TimeSeriesPointDto[] {
  const buckets = new Map<string, ClienteMetrica[]>();

  for (const m of metricas) {
    const key = m.fecha.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, items]) => {
      const from = new Date(day + 'T00:00:00.000Z');
      const to = new Date(day + 'T23:59:59.999Z');
      return {
        bucket: day,
        from: from.toISOString(),
        to: to.toISOString(),
        pesosAhorro: sumPesos(items),
        puntosAdquiridos: sumPuntos(items),
        operaciones: items.length,
      };
    });
}

export function buildWeeklySeries(
  metricas: ClienteMetrica[],
): TimeSeriesPointDto[] {
  const buckets = new Map<string, ClienteMetrica[]>();

  for (const m of metricas) {
    const { year, week } = getISOWeek(m.fecha);
    const key = `${year}-W${week.toString().padStart(2, '0')}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([weekKey, items]) => {
      const [yearStr, weekStr] = weekKey.split('-W');
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      const { from, to } = getWeekDateRange(year, week);

      return {
        bucket: weekKey,
        from: from.toISOString(),
        to: to.toISOString(),
        pesosAhorro: sumPesos(items),
        puntosAdquiridos: sumPuntos(items),
        operaciones: items.length,
      };
    });
}

export function buildMonthlySeries(
  metricas: ClienteMetrica[],
): TimeSeriesPointDto[] {
  const buckets = new Map<string, ClienteMetrica[]>();

  for (const m of metricas) {
    const year = m.fecha.getFullYear();
    const month = (m.fecha.getMonth() + 1).toString().padStart(2, '0');
    const key = `${year}-${month}`; // YYYY-MM
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([monthKey, items]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const to = new Date(Date.UTC(year, month, 0, 23, 59, 59)); // último día del mes

      return {
        bucket: monthKey,
        from: from.toISOString(),
        to: to.toISOString(),
        pesosAhorro: sumPesos(items),
        puntosAdquiridos: sumPuntos(items),
        operaciones: items.length,
      };
    });
}

// --------------------------------------------------------
// Helpers de fecha
// --------------------------------------------------------

export function subDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d;
}

export function subMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() - months);
  return d;
}

export function subYears(base: Date, years: number): Date {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() - years);
  return d;
}

export function getISOWeek(date: Date): { year: number; week: number } {
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+tmp - +yearStart) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week };
}

export function getWeekDateRange(
  year: number,
  week: number,
): { from: Date; to: Date } {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay();
  const ISOweekStart = new Date(simple);
  if (dayOfWeek <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  const from = ISOweekStart;
  const to = new Date(ISOweekStart);
  to.setUTCDate(to.getUTCDate() + 6);
  to.setUTCHours(23, 59, 59, 999);
  return { from, to };
}
