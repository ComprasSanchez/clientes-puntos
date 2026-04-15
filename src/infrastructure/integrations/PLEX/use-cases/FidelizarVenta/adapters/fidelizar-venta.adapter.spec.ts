import { AnulacionUseCase } from '@puntos/application/use-cases/Anulacion/Anulacion';
import { CompraUseCase } from '@puntos/application/use-cases/Compra/Compra';
import { DevolucionUseCase } from '@puntos/application/use-cases/Devolucion/Devolucion';
import { ClienteFindByTarjeta } from '@cliente/application/use-cases/ClienteFindByTarjeta/ClienteFindByTarjeta';
import { FidelizarVentaPlexAdapter } from './fidelizar-venta.adapter';

describe('FidelizarVentaPlexAdapter', () => {
  let compraUseCase: { run: jest.Mock };
  let devolucionUseCase: { run: jest.Mock };
  let anulacionUseCase: { run: jest.Mock };
  let clienteFindByTarjeta: { run: jest.Mock };
  let adapter: FidelizarVentaPlexAdapter;

  beforeEach(() => {
    compraUseCase = { run: jest.fn() };
    devolucionUseCase = { run: jest.fn() };
    anulacionUseCase = { run: jest.fn() };
    clienteFindByTarjeta = { run: jest.fn() };

    adapter = new FidelizarVentaPlexAdapter(
      compraUseCase as unknown as CompraUseCase,
      devolucionUseCase as unknown as DevolucionUseCase,
      anulacionUseCase as unknown as AnulacionUseCase,
      clienteFindByTarjeta as unknown as ClienteFindByTarjeta,
    );
  });

  it('procesa una venta (codAccion 200) y retorna XML OK', async () => {
    clienteFindByTarjeta.run.mockResolvedValue({ id: 'cliente-1' });
    compraUseCase.run.mockResolvedValue({
      handlerResult: {
        operacion: { id: { value: 9001 } },
        saldoNuevo: 450,
      },
      puntosDebito: 10,
      puntosCredito: 0,
    });

    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>200</CodAccion>' +
      '<Venta>' +
      '<IdMovimiento>123</IdMovimiento>' +
      '<NroTarjeta>555</NroTarjeta>' +
      '<ImporteTotal>100,50</ImporteTotal>' +
      '<ValorCanjePunto>1</ValorCanjePunto>' +
      '<PuntosCanjeados>10</PuntosCanjeados>' +
      '<IdComprobante>1</IdComprobante>' +
      '<NroComprobante>A-1</NroComprobante>' +
      '<FechaComprobante>2026-03-01</FechaComprobante>' +
      '<Productos><IdProducto>10</IdProducto><Cantidad>2</Cantidad><Precio>50,25</Precio></Productos>' +
      '</Venta>' +
      '</MensajeFidelyGB>';

    const result = await adapter.handle(xml, 'SUC-1');

    expect(compraUseCase.run).toHaveBeenCalledTimes(1);
    expect(devolucionUseCase.run).not.toHaveBeenCalled();
    expect(anulacionUseCase.run).not.toHaveBeenCalled();
    expect(result.response).toContain('<RespCode>0</RespCode>');
    expect(result.response).toContain('<IdMovimiento>9001</IdMovimiento>');
  });
});
