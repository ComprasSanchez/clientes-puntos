export class Presentacion {
  private constructor(public readonly value: string) {}
  static from(value: string): Presentacion {
    const v = value?.trim() ?? '';
    return new Presentacion(v);
  }
}
