import { Categoria } from '../entities/Categoria';
import { CategoriaId } from '../value-objects/CategoriaId';

export interface CategoriaRepository {
  /** Lista todas las categorías existentes. */
  findAll(): Promise<Categoria[]>;

  findDefault(): Promise<Categoria | undefined>;

  /** Busca una categoría por su ID. */
  findById(id: CategoriaId): Promise<Categoria | null>;

  /** Crea una nueva categoría. */
  create(categoria: Categoria): Promise<void>;

  /** Actualiza una categoría existente. */
  update(categoria: Categoria): Promise<void>;

  /** Elimina (o desactiva) una categoría por su ID. */
  delete(id: CategoriaId): Promise<void>;
}
