export class ProductoId {
  private constructor(public readonly value: string) {}
  static from(value: string): ProductoId {
    if (!value || value.trim().length === 0)
      throw new Error('IdProducto inválido');
    return new ProductoId(value.trim());
  }
}
