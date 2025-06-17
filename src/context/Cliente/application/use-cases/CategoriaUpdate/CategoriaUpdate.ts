import { CategoriaRepository } from '../../../core/repository/CategoriaRepository';
import { CategoriaId } from '../../../core/value-objects/CategoriaId';
import { CategoriaNombre } from '../../../core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '../../../core/value-objects/CategoriaDescripcion';
import { CategoriaNotFoundError } from 'src/context/Cliente/core/exceptions/CategoriaNotFoundError';

export class CategoriaUpdate {
  constructor(private readonly repo: CategoriaRepository) {}

  /**
   * Modifica una categoría existente.
   */
  async run(input: {
    id: string;
    nombre?: string;
    descripcion?: string | null;
  }): Promise<void> {
    const idVo = new CategoriaId(input.id);
    const categoria = await this.repo.findById(idVo);
    if (!categoria) throw new CategoriaNotFoundError('Categoria no encontrada');

    if (input.nombre !== undefined) {
      categoria.cambiarNombre(new CategoriaNombre(input.nombre));
    }

    if (input.descripcion !== undefined) {
      // Creamos el VO sólo si no es null
      const descVo =
        input.descripcion === null
          ? new CategoriaDescripcion(null)
          : new CategoriaDescripcion(input.descripcion);
      categoria.cambiarDescripcion(descVo);
    }

    await this.repo.update(categoria);
  }
}
