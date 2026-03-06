import { ActualizarPrecioProducto } from 'src/context/Producto/application/use-cases/ActualizarPreciosProducto';
import { DesactivarProducto } from 'src/context/Producto/application/use-cases/DesactivarProducto';
import { ReactivarProducto } from 'src/context/Producto/application/use-cases/ReactivarProducto';
import { UpsertProductos } from 'src/context/Producto/application/use-cases/UpsertProductos';
import { FidelizarProductoPlexAdapter } from './fidelizar-producto.adapter';

describe('FidelizarProductoPlexAdapter', () => {
  let upsertProductos: { run: jest.Mock };
  let desactivarProducto: { run: jest.Mock };
  let reactivarProducto: { run: jest.Mock };
  let actualizarPrecio: { run: jest.Mock };
  let adapter: FidelizarProductoPlexAdapter;

  beforeEach(() => {
    upsertProductos = { run: jest.fn() };
    desactivarProducto = { run: jest.fn() };
    reactivarProducto = { run: jest.fn() };
    actualizarPrecio = { run: jest.fn() };

    adapter = new FidelizarProductoPlexAdapter(
      upsertProductos as unknown as UpsertProductos,
      desactivarProducto as unknown as DesactivarProducto,
      reactivarProducto as unknown as ReactivarProducto,
      actualizarPrecio as unknown as ActualizarPrecioProducto,
    );
  });

  it('procesa alta/edición (codAccion 500) y responde OK', async () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>500</CodAccion>' +
      '<Productos>' +
      '<IdProducto>1001</IdProducto>' +
      '<Producto>Arroz</Producto>' +
      '<Presentacion>1kg</Presentacion>' +
      '<Costo>100</Costo>' +
      '<Precio>150</Precio>' +
      '</Productos>' +
      '</MensajeFidelyGB>';

    const result = await adapter.handle(xml);

    expect(upsertProductos.run).toHaveBeenCalledTimes(1);
    expect(result.response).toContain('<respCode>0</respCode>');
  });

  it('devuelve error cuando codAccion es desconocido', async () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB><CodAccion>999</CodAccion><Productos><IdProducto>1</IdProducto></Productos></MensajeFidelyGB>';

    const result = await adapter.handle(xml);

    expect(result.response).toContain('<respCode>1</respCode>');
    expect(result.response).toContain('CodAccion desconocido: 999');
  });
});
