/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { CategoriaRepository } from '@cliente/core/repository/CategoriaRepository';
import { CategoriaNotFoundError } from '@cliente/core/exceptions/CategoriaNotFoundError';
import { Categoria } from '@cliente/core/entities/Categoria';
import { CategoriaId } from '@cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from '@cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from '@cliente/core/value-objects/CategoriaDescripcion';
import { CategoriaDelete } from '@cliente/application/use-cases/CategoriaDelete/CategoriaDelete';

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
