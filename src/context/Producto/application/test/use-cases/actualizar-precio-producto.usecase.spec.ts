import { ActualizarPrecioProducto } from '../../use-cases/ActualizarPreciosProducto';
import { ProductoRepository } from '../../../core/repositories/ProductoRepository';
import { Producto } from '../../../core/entities/Producto';
import { ProductoId } from '../../../core/value-objects/ProductoId';
import { NombreProducto } from '../../../core/value-objects/NombreProducto';
import { Presentacion } from '../../../core/value-objects/Presentacion';
import { Dinero } from '../../../core/value-objects/Dinero';

function buildProducto(): Producto {
  return Producto.create({
    id: ProductoId.from('prod-1001'),
    codExt: 1001,
    nombre: NombreProducto.from('Producto Demo'),
    presentacion: Presentacion.from('Caja x 1'),
    costo: Dinero.from(100),
    precio: Dinero.from(150),
    clasificadores: [],
    activa: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  });
}

describe('ActualizarPrecioProducto', () => {
  let repo: jest.Mocked<ProductoRepository>;
  let useCase: ActualizarPrecioProducto;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      upsertMany: jest.fn(),
      list: jest.fn(),
      findByCodExt: jest.fn(),
      save: jest.fn(),
      upsertClasificadoresMasters: jest.fn(),
    };

    useCase = new ActualizarPrecioProducto(repo);
  });

  it('lanza error si el producto no existe', async () => {
    repo.findByCodExt.mockResolvedValue(null);

    await expect(
      useCase.run({ codExt: 9999, nuevoPrecio: 120 }),
    ).rejects.toThrow('Producto no encontrado');

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('actualiza precio y costo cuando ambos vienen informados', async () => {
    const producto = buildProducto();
    repo.findByCodExt.mockResolvedValue(producto);

    await useCase.run({ codExt: 1001, nuevoPrecio: 200, nuevoCosto: 130 });

    expect(producto.precio.value).toBe(200);
    expect(producto.costo.value).toBe(130);
    expect(repo.save).toHaveBeenCalledWith(producto);
  });

  it('persiste sin cambios cuando no recibe nuevos montos', async () => {
    const producto = buildProducto();
    repo.findByCodExt.mockResolvedValue(producto);

    await useCase.run({ codExt: 1001 });

    expect(producto.precio.value).toBe(150);
    expect(producto.costo.value).toBe(100);
    expect(repo.save).toHaveBeenCalledWith(producto);
  });
});
