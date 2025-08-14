export class NombreProducto {
  private constructor(public readonly value: string) {}
  static from(value: string): NombreProducto {
    const v = value?.trim();
    if (!v) throw new Error('Nombre de producto requerido');
    return new NombreProducto(v);
  }
}
