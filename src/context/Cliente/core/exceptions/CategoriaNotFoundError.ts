export class CategoriaNotFoundError extends Error {
  constructor(id: string) {
    super(`Categoria con ID ${id} no encontrada`);
    Object.setPrototypeOf(this, CategoriaNotFoundError.prototype);
  }
}
