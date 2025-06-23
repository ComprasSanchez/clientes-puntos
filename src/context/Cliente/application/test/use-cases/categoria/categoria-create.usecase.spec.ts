import { CategoriaRepository } from 'src/context/Cliente/core/repository/CategoriaRepository';
import { UUIDGenerator } from 'src/shared/core/uuid/UuidGenerator';
import { CategoriaCreate } from '../../../use-cases/CategoriaCreate/CategoriaCreate';

describe('CategoriaCreate Use Case', () => {
  let repo: jest.Mocked<CategoriaRepository>;
  let idGen: jest.Mocked<UUIDGenerator>;
  let useCase: CategoriaCreate;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    idGen = {
      generate: jest
        .fn()
        .mockReturnValue('00000000-0000-4000-8000-000000000000'),
    };

    useCase = new CategoriaCreate(repo, idGen);
  });

  it('debe invocar repo.create con una Categoria válida (con descripción)', async () => {
    await useCase.run({ nombre: 'General', descripcion: 'Descripción demo' });

    // Desestructuramos el primer argumento de la primera llamada al repo
    const [categoria] = repo.create.mock.calls[0];

    // Verificamos sus props públicas
    expect(categoria.id.value).toBe('00000000-0000-4000-8000-000000000000');
    expect(categoria.nombre.value).toBe('General');
    expect(categoria.descripcion?.value).toBe('Descripción demo');
  });

  it('debe invocar repo.create con una Categoria sin descripción', async () => {
    await useCase.run({ nombre: 'SinDesc' });

    const [categoria] = repo.create.mock.calls[0];
    expect(categoria.id.value).toBe('00000000-0000-4000-8000-000000000000');
    expect(categoria.nombre.value).toBe('SinDesc');
    expect(categoria.descripcion.value).toBeNull();
  });
});
