import { Categoria } from '../../entities/Categoria';
import { CategoriaDescripcion } from '../../value-objects/CategoriaDescripcion';
import { CategoriaId } from '../../value-objects/CategoriaId';
import { CategoriaNombre } from '../../value-objects/CategoriaNombre';

export const fakeCategoria = new Categoria(
  new CategoriaId('11111111-1111-4111-8111-111111111111'),
  new CategoriaNombre('General'),
  null,
  new CategoriaDescripcion('Categoría general de clientes'),
);
