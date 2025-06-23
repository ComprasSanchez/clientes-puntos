import { CategoriaRepository } from 'src/context/Cliente/core/repository/CategoriaRepository';
import { CategoriaNotFoundError } from 'src/context/Cliente/core/exceptions/CategoriaNotFoundError';
import { Categoria } from 'src/context/Cliente/core/entities/Categoria';
import { CategoriaId } from 'src/context/Cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from 'src/context/Cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from 'src/context/Cliente/core/value-objects/CategoriaDescripcion';
import { CategoriaDelete } from '../../../use-cases/CategoriaDelete/CategoriaDelete';

describe('CategoriaDelete Use Case', () => {
  let repo: jest.Mocked<CategoriaRepository>;
  let useCase: CategoriaDelete;
  let existing: Categoria;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CategoriaDelete(repo);

    existing = new Categoria(
      new CategoriaId('11111111-1111-4111-8111-111111111111'),
      new CategoriaNombre('General'),
      new CategoriaDescripcion('Descripción genérica'),
    );
  });

  it('lanza CategoriaNotFoundError si la categoría no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.run('22222222-2222-4222-8222-222222222222'),
    ).rejects.toBeInstanceOf(CategoriaNotFoundError);
  });

  it('invoca repo.delete con el ID correcto cuando existe la categoría', async () => {
    repo.findById.mockResolvedValue(existing);
    await useCase.run(existing.id.value);

    // Verificamos que se haya pasado un VO CategoriaId con el mismo valor
    const passed = repo.delete.mock.calls[0][0];
    expect(passed.value).toBe(existing.id.value);
  });
});
