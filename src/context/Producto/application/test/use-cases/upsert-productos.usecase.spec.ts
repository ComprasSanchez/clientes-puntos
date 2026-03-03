import { UpsertProductos } from '../../use-cases/UpsertProductos';
import { ProductoRepository } from '../../../core/repositories/ProductoRepository';
import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { UpsertProductoPlano } from '../../../core/dtos/UpsertProductoPlano';
import { TipoClasificador } from '../../../core/enums/TipoClasificador.enum';
import { Producto } from '../../../core/entities/Producto';
import { ProductoId } from '../../../core/value-objects/ProductoId';
import { NombreProducto } from '../../../core/value-objects/NombreProducto';
import { Presentacion } from '../../../core/value-objects/Presentacion';
import { Dinero } from '../../../core/value-objects/Dinero';

function buildExistente(): Producto {
  return Producto.create({
    id: ProductoId.from('prod-existente'),
    codExt: 101,
    nombre: NombreProducto.from('Viejo'),
    presentacion: Presentacion.from('Unidad'),
    costo: Dinero.from(10),
    precio: Dinero.from(20),
    clasificadores: [],
    activa: true,
  });
}

describe('UpsertProductos', () => {
  let repo: jest.Mocked<ProductoRepository>;
  let idGen: jest.Mocked<UUIDGenerator>;
  let useCase: UpsertProductos;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      upsertMany: jest.fn(),
      list: jest.fn(),
      findByCodExt: jest.fn(),
      save: jest.fn(),
      upsertClasificadoresMasters: jest.fn(),
    };
    idGen = {
      generate: jest.fn().mockReturnValue('prod-generado'),
    };

    useCase = new UpsertProductos(repo, idGen);
  });

  it('deduplica clasificadores maestros y completa nombre faltante', async () => {
    const input: UpsertProductoPlano[] = [
      {
        idProducto: 101,
        producto: 'Producto 1',
        presentacion: 'Caja',
        costo: 10,
        precio: 20,
        activa: true,
        clasificadores: [
          {
            idTipoClasificador: TipoClasificador.RUBRO,
            idClasificador: 1,
            nombre: '',
          },
          {
            idTipoClasificador: TipoClasificador.RUBRO,
            idClasificador: 1,
            nombre: 'Rubro Uno',
          },
        ],
      },
    ];

    repo.findByCodExt.mockResolvedValue(null);

    await useCase.run(input);

    expect(repo.upsertClasificadoresMasters).toHaveBeenCalledWith([
      { tipo: TipoClasificador.RUBRO, idClasificador: 1, nombre: 'Rubro Uno' },
    ]);
    expect(repo.upsertMany).toHaveBeenCalledTimes(1);
  });

  it('rehusa id existente cuando ya hay producto por codExt', async () => {
    const input: UpsertProductoPlano[] = [
      {
        idProducto: 101,
        producto: 'Producto actualizado',
        presentacion: 'Bolsa',
        costo: 15,
        precio: 30,
        activa: true,
        clasificadores: [],
      },
    ];

    repo.findByCodExt.mockResolvedValue(buildExistente());

    await useCase.run(input);

    const productos = repo.upsertMany.mock.calls[0][0];
    expect(productos[0].id.value).toBe('prod-existente');
    expect(idGen.generate).not.toHaveBeenCalled();
  });

  it('lanza error cuando el idProducto no es valido', async () => {
    await expect(
      useCase.run([
        {
          idProducto: undefined as unknown as number,
          producto: 'Invalido',
          presentacion: '',
          costo: 0,
          precio: 0,
          activa: true,
          clasificadores: [],
        },
      ]),
    ).rejects.toThrow('IdProducto inválido');
  });
});
