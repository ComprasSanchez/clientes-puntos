import { ListarProductos } from '../../use-cases/ListarProductos';
import { ProductoRepository } from '../../../core/repositories/ProductoRepository';
import { TipoClasificador } from '../../../core/enums/TipoClasificador.enum';

describe('ListarProductos', () => {
  let repo: jest.Mocked<ProductoRepository>;
  let useCase: ListarProductos;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      upsertMany: jest.fn(),
      list: jest.fn(),
      findByCodExt: jest.fn(),
      save: jest.fn(),
      upsertClasificadoresMasters: jest.fn(),
    };

    useCase = new ListarProductos(repo);
  });

  it('delegates al repositorio sin params', async () => {
    const expected = { items: [], total: 0 };
    repo.list.mockResolvedValue(expected);

    const result = await useCase.run();

    expect(repo.list).toHaveBeenCalledWith(undefined);
    expect(result).toBe(expected);
  });

  it('delegates al repositorio con filtros', async () => {
    const params = {
      search: 'yerba',
      clasificador: {
        tipo: TipoClasificador.RUBRO,
        idClasificador: '10',
      },
      limit: 20,
      offset: 0,
    };
    repo.list.mockResolvedValue({ items: [], total: 0 });

    await useCase.run(params);

    expect(repo.list).toHaveBeenCalledWith(params);
  });
});
