import { GetProductoById } from '../../use-cases/GetProductoById';
import { ProductoRepository } from '../../../core/repositories/ProductoRepository';

describe('GetProductoById', () => {
  let repo: jest.Mocked<ProductoRepository>;
  let useCase: GetProductoById;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      upsertMany: jest.fn(),
      list: jest.fn(),
      findByCodExt: jest.fn(),
      save: jest.fn(),
      upsertClasificadoresMasters: jest.fn(),
    };

    useCase = new GetProductoById(repo);
  });

  it('consulta el repo con el ProductoId mapeado', async () => {
    repo.findById.mockResolvedValue(null);

    await useCase.run('prod-1');

    expect(repo.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'prod-1' }),
    );
  });

  it('propaga error cuando el id es invalido', async () => {
    await expect(useCase.run('   ')).rejects.toThrow('IdProducto inválido');
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('devuelve el resultado del repositorio', async () => {
    const expected = { codExt: 1001 } as never;
    repo.findById.mockResolvedValue(expected);

    const result = await useCase.run('prod-1001');

    expect(result).toBe(expected);
  });
});
