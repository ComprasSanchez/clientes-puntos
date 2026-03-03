import { ReactivarProducto } from '../../use-cases/ReactivarProducto';
import { ProductoRepository } from '../../../core/repositories/ProductoRepository';
import { Producto } from '../../../core/entities/Producto';
import { ProductoId } from '../../../core/value-objects/ProductoId';
import { NombreProducto } from '../../../core/value-objects/NombreProducto';
import { Presentacion } from '../../../core/value-objects/Presentacion';
import { Dinero } from '../../../core/value-objects/Dinero';

function buildProducto(activa = false): Producto {
  return Producto.create({
    id: ProductoId.from('prod-3001'),
    codExt: 3001,
    nombre: NombreProducto.from('Producto B'),
    presentacion: Presentacion.from('Unidad'),
    costo: Dinero.from(70),
    precio: Dinero.from(90),
    clasificadores: [],
    activa,
  });
}

describe('ReactivarProducto', () => {
  let repo: jest.Mocked<ProductoRepository>;
  let useCase: ReactivarProducto;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      upsertMany: jest.fn(),
      list: jest.fn(),
      findByCodExt: jest.fn(),
      save: jest.fn(),
      upsertClasificadoresMasters: jest.fn(),
    };

    useCase = new ReactivarProducto(repo);
  });

  it('lanza error cuando el producto no existe', async () => {
    repo.findByCodExt.mockResolvedValue(null);

    await expect(useCase.run(3001)).rejects.toThrow('Producto no encontrado');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('reactiva el producto y persiste', async () => {
    const producto = buildProducto(false);
    repo.findByCodExt.mockResolvedValue(producto);

    await useCase.run(3001);

    expect(producto.activo).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(producto);
  });
});
