import { ClienteCreate } from '@cliente/application/use-cases/ClienteCreate/ClienteCreate';
import { ClienteUpdate } from '@cliente/application/use-cases/ClienteUpdate/ClienteUpdate';
import { ClientesSyncFromPuntosService } from '@infrastructure/integrations/CLIENTES/services/clientes-sync-from-puntos.service';
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';
import { FidelizarClientePlexAdapter } from './fidelizar-cliente.adapter';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';

describe('FidelizarClientePlexAdapter', () => {
  let clienteCreate: { run: jest.Mock };
  let clienteUpdate: { run: jest.Mock };
  let clientesSync: { notifyClienteFidelizado: jest.Mock };
  let clientesFsaClient: { upsertVerificacion: jest.Mock };
  let clienteRepository: { findByDni: jest.Mock };
  let adapter: FidelizarClientePlexAdapter;

  beforeEach(() => {
    clienteCreate = { run: jest.fn() };
    clienteUpdate = { run: jest.fn() };
    clientesSync = { notifyClienteFidelizado: jest.fn() };
    clientesFsaClient = {
      upsertVerificacion: jest.fn().mockResolvedValue(undefined),
    };
    clienteRepository = { findByDni: jest.fn().mockResolvedValue(null) };

    adapter = new FidelizarClientePlexAdapter(
      clienteCreate as unknown as ClienteCreate,
      clienteUpdate as unknown as ClienteUpdate,
      clientesFsaClient as unknown as ClientesFsaClient,
      clientesSync as unknown as ClientesSyncFromPuntosService,
      clienteRepository as unknown as ClienteRepository,
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

  it('ignora IDClienteFidely en codAccion 100 y 103', async () => {
    clienteCreate.run.mockResolvedValue({
      id: { value: 'puntos-id-2' },
      dni: { value: '30111222' },
      fidelyStatus: {
        idFidely: { value: 9900 },
        tarjetaFidely: { value: '30111222' },
      },
    });

    const xml100 =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>100</CodAccion>' +
      '<Cliente>' +
      '<IDClienteFidely>   </IDClienteFidely>' +
      '<NroTarjeta>000123</NroTarjeta>' +
      '<DNI>30111222</DNI>' +
      '<Nombre>Juan</Nombre>' +
      '<Apellido>Perez</Apellido>' +
      '<Sexo>M</Sexo>' +
      '<FecNac>1990-01-01</FecNac>' +
      '</Cliente>' +
      '</MensajeFidelyGB>';

    await adapter.handle(xml100);

    const firstCallInput = clienteCreate.run.mock.calls[0][0];
    expect(firstCallInput.fidely_customerid).toBeUndefined();

    const xml103 =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>103</CodAccion>' +
      '<Cliente>' +
      '<IDClienteFidely>123456</IDClienteFidely>' +
      '<NroTarjeta>000123</NroTarjeta>' +
      '<DNI>30111222</DNI>' +
      '<Nombre>Juan</Nombre>' +
      '<Apellido>Perez</Apellido>' +
      '<Sexo>M</Sexo>' +
      '<FecNac>1990-01-01</FecNac>' +
      '</Cliente>' +
      '</MensajeFidelyGB>';

    await adapter.handle(xml103);

    const secondCallInput = clienteCreate.run.mock.calls[1][0];
    expect(secondCallInput.fidely_customerid).toBeUndefined();
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

  it('rechaza codAccion 100 si el DNI ya existe', async () => {
    clienteRepository.findByDni.mockResolvedValue({
      id: { value: 'existente' },
    });

    const xml100 =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>100</CodAccion>' +
      '<Cliente>' +
      '<DNI>30111222</DNI>' +
      '<Nombre>Juan</Nombre>' +
      '<Apellido>Perez</Apellido>' +
      '<Sexo>M</Sexo>' +
      '<FecNac>1990-01-01</FecNac>' +
      '</Cliente>' +
      '</MensajeFidelyGB>';

    await expect(adapter.handle(xml100)).rejects.toThrow(
      'DNI 30111222 ya existe; para actualizar use codAccion 101 o 102',
    );
    expect(clienteCreate.run).not.toHaveBeenCalled();
  });

  it('rechaza codAccion 103 si el DNI ya existe', async () => {
    clienteRepository.findByDni.mockResolvedValue({
      id: { value: 'existente' },
    });

    const xml103 =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>103</CodAccion>' +
      '<Cliente>' +
      '<DNI>30111222</DNI>' +
      '<Nombre>Juan</Nombre>' +
      '<Apellido>Perez</Apellido>' +
      '<Sexo>M</Sexo>' +
      '<FecNac>1990-01-01</FecNac>' +
      '</Cliente>' +
      '</MensajeFidelyGB>';

    await expect(adapter.handle(xml103)).rejects.toThrow(
      'DNI 30111222 ya existe; para actualizar use codAccion 101 o 102',
    );
    expect(clienteCreate.run).not.toHaveBeenCalled();
  });
});
