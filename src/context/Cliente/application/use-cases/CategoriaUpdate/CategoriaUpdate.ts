/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';

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
    if (!categoria) throw new CategoriaNotFoundError(input.id);

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
