import { DesactivarProducto } from '../../use-cases/DesactivarProducto';
import { ProductoRepository } from '../../../core/repositories/ProductoRepository';
import { Producto } from '../../../core/entities/Producto';
import { ProductoId } from '../../../core/value-objects/ProductoId';
import { NombreProducto } from '../../../core/value-objects/NombreProducto';
import { Presentacion } from '../../../core/value-objects/Presentacion';
import { Dinero } from '../../../core/value-objects/Dinero';

function buildProducto(activa = true): Producto {
  return Producto.create({
    id: ProductoId.from('prod-2001'),
    codExt: 2001,
    nombre: NombreProducto.from('Producto A'),
    presentacion: Presentacion.from('Unidad'),
    costo: Dinero.from(50),
    precio: Dinero.from(80),
    clasificadores: [],
    activa,
  });
}

describe('DesactivarProducto', () => {
  let repo: jest.Mocked<ProductoRepository>;
  let useCase: DesactivarProducto;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      upsertMany: jest.fn(),
      list: jest.fn(),
      findByCodExt: jest.fn(),
      save: jest.fn(),
      upsertClasificadoresMasters: jest.fn(),
    };

    useCase = new DesactivarProducto(repo);
  });

  it('lanza error cuando el producto no existe', async () => {
    repo.findByCodExt.mockResolvedValue(null);

    await expect(useCase.run(2001)).rejects.toThrow('Producto no encontrado');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('desactiva el producto y persiste', async () => {
    const producto = buildProducto(true);
    repo.findByCodExt.mockResolvedValue(producto);

    await useCase.run(2001);

    expect(producto.activo).toBe(false);
    expect(repo.save).toHaveBeenCalledWith(producto);
  });
});
