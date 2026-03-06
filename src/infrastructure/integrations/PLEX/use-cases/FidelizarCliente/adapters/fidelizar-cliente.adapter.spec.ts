import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { ClientesSyncFromPuntosService } from '@infrastructure/integrations/CLIENTES/services/clientes-sync-from-puntos.service';
import { FidelizarClientePlexAdapter } from './fidelizar-cliente.adapter';

describe('FidelizarClientePlexAdapter', () => {
  let clienteCreate: { run: jest.Mock };
  let clienteUpdate: { run: jest.Mock };
  let clientesSync: { notifyClienteFidelizado: jest.Mock };
  let adapter: FidelizarClientePlexAdapter;

  beforeEach(() => {
    clienteCreate = { run: jest.fn() };
    clienteUpdate = { run: jest.fn() };
    clientesSync = { notifyClienteFidelizado: jest.fn() };

    adapter = new FidelizarClientePlexAdapter(
      clienteCreate as unknown as ClienteCreate,
      clienteUpdate as unknown as ClienteUpdate,
      clientesSync as unknown as ClientesSyncFromPuntosService,
    );
  });

  it('crea cliente para codAccion 100 y notifica a clientes', async () => {
    clienteCreate.run.mockResolvedValue({
      id: { value: 'puntos-id-1' },
      dni: { value: '30111222' },
      fidelyStatus: {
        idFidely: { value: 7788 },
        tarjetaFidely: { value: '000123' },
      },
    });

    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>100</CodAccion>' +
      '<Cliente>' +
      '<NroTarjeta>000123</NroTarjeta>' +
      '<DNI>30111222</DNI>' +
      '<Nombre>Juan</Nombre>' +
      '<Apellido>Perez</Apellido>' +
      '<Sexo>M</Sexo>' +
      '<FecNac>1990-01-01</FecNac>' +
      '<Categoria>1</Categoria>' +
      '</Cliente>' +
      '</MensajeFidelyGB>';

    const result = await adapter.handle(xml);

    expect(clienteCreate.run).toHaveBeenCalledTimes(1);
    expect(clienteUpdate.run).not.toHaveBeenCalled();
    expect(clientesSync.notifyClienteFidelizado).toHaveBeenCalledWith({
      puntosId: 'puntos-id-1',
      dni: '30111222',
    });
    expect(result.response).toContain('<RespCode>0</RespCode>');
    expect(result.response).toContain(
      '<IDClienteFidely>7788</IDClienteFidely>',
    );
  });

  it('lanza error en modificar/reemplazar si falta IDClienteFidely', async () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>101</CodAccion>' +
      '<Cliente><NroTarjeta>000123</NroTarjeta></Cliente>' +
      '</MensajeFidelyGB>';

    await expect(adapter.handle(xml)).rejects.toThrow(
      'IDClienteFidely es requerido para modificar o reemplazar tarjeta',
    );
  });
});
