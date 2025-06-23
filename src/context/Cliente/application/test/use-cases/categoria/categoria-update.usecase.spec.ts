import { CategoriaRepository } from 'src/context/Cliente/core/repository/CategoriaRepository';
import { CategoriaNotFoundError } from 'src/context/Cliente/core/exceptions/CategoriaNotFoundError';
import { Categoria } from 'src/context/Cliente/core/entities/Categoria';
import { CategoriaId } from 'src/context/Cliente/core/value-objects/CategoriaId';
import { CategoriaNombre } from 'src/context/Cliente/core/value-objects/CategoriaNombre';
import { CategoriaDescripcion } from 'src/context/Cliente/core/value-objects/CategoriaDescripcion';
import { CategoriaUpdate } from '../../../use-cases/CategoriaUpdate/CategoriaUpdate';

describe('CategoriaUpdate Use Case', () => {
  let repo: jest.Mocked<CategoriaRepository>;
  let useCase: CategoriaUpdate;
  let existing: Categoria;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CategoriaUpdate(repo);

    existing = new Categoria(
      new CategoriaId('11111111-1111-4111-8111-111111111111'),
      new CategoriaNombre('General'),
      new CategoriaDescripcion('Descripción inicial'),
    );
  });

  it('lanza CategoriaNotFoundError si la categoría no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.run({ id: '33333333-3333-4333-8333-333333333333' }),
    ).rejects.toBeInstanceOf(CategoriaNotFoundError);
  });

  it('solo actualiza el nombre cuando se suministra', async () => {
    repo.findById.mockResolvedValue(existing);
    await useCase.run({ id: existing.id.value, nombre: 'NuevoNombre' });

    expect(existing.nombre.value).toBe('NuevoNombre');
  });

  it('solo actualiza la descripción a un nuevo texto cuando se suministra', async () => {
    repo.findById.mockResolvedValue(existing);
    await useCase.run({
      id: existing.id.value,
      descripcion: 'Desc actualizada',
    });

    expect(existing.descripcion?.value).toBe('Desc actualizada');
  });

  it('permite establecer la descripción a null cuando se pasa null', async () => {
    repo.findById.mockResolvedValue(existing);
    await useCase.run({ id: existing.id.value, descripcion: null });

    // Suponiendo que CategoriaDescripcion.value === null cuando se inicializa con null
    expect(existing.descripcion?.value).toBeNull();
  });
});
