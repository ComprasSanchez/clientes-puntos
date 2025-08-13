export class FechaDiaRange {
  constructor(
    public readonly startUtc: Date,
    public readonly endUtc: Date,
  ) {
    if (!(startUtc instanceof Date) || isNaN(startUtc.getTime())) {
      throw new Error('startUtc inválido');
    }
    if (!(endUtc instanceof Date) || isNaN(endUtc.getTime())) {
      throw new Error('endUtc inválido');
    }
    if (startUtc >= endUtc) {
      throw new Error('Rango de fechas inválido: start >= end');
    }
  }
}
