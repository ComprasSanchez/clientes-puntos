import { ClienteFindUpdatedBetween } from '@cliente/application/use-cases/ClienteFindUpdatedBetween/ClienteFindUpdatedBetween';
import { ConsultarNovedadesClientePlexAdapter } from './consultar-novedades-cliente.adapter';
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';

describe('ConsultarNovedadesClientePlexAdapter', () => {
  let clienteFindUpdatedBetween: { run: jest.Mock };
  let clientesFsaClient: {
    findManyByDni: jest.Mock;
    findManyByExternalIds: jest.Mock;
  };
  let adapter: ConsultarNovedadesClientePlexAdapter;

  beforeEach(() => {
    clienteFindUpdatedBetween = { run: jest.fn() };
    clientesFsaClient = {
      findManyByDni: jest.fn().mockResolvedValue(new Map()),
      findManyByExternalIds: jest.fn().mockResolvedValue(new Map()),
    };
    adapter = new ConsultarNovedadesClientePlexAdapter(
      clienteFindUpdatedBetween as unknown as ClienteFindUpdatedBetween,
      clientesFsaClient as unknown as ClientesFsaClient,
    );
  });

  it('procesa codAccion 302 y responde novedades en XML', async () => {
    clienteFindUpdatedBetween.run.mockResolvedValue([
      {
        id: 'cli-1',
        dni: '30111222',
        nombre: 'Juan',
        apellido: 'Perez',
        sexo: 'M',
        fechaNacimiento: '1990-01-01',
        status: 'activo',
        categoria: 2,
        email: 'juan@mail.com',
        telefono: '111',
        direccion: 'Calle 123',
        codPostal: '5000',
        localidad: 'Cordoba',
        provincia: 'Cordoba',
        idFidely: 77,
        tarjetaFidely: '000123',
        fechaBaja: null,
      },
    ]);

    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<Proveedor>FIDELYGB</Proveedor>' +
      '<CodAccion>302</CodAccion>' +
      '<FechaDesde>01/03/2026 00:00:00</FechaDesde>' +
      '<FechaHasta>06/03/2026 23:59:59</FechaHasta>' +
      '</MensajeFidelyGB>';

    const result = await adapter.handle(xml, 'SUC-01');

    expect(clienteFindUpdatedBetween.run).toHaveBeenCalledTimes(1);
    expect(clienteFindUpdatedBetween.run).toHaveBeenCalledWith(
      {
        from: new Date(2026, 2, 1, 0, 0, 0),
        to: new Date(2026, 2, 6, 23, 59, 59),
      },
      { skipCanonicalHydration: true },
    );
    expect(clientesFsaClient.findManyByExternalIds).toHaveBeenCalledWith(
      'PUNTOS',
      ['cli-1'],
    );
    expect(clientesFsaClient.findManyByDni).toHaveBeenCalledWith(['30111222']);
    expect(result.response).toContain('<RespCode>0</RespCode>');
    expect(result.response).toContain('<Novedades>');
    expect(result.response).toContain('<Clientes>');
    expect(result.response).toContain('<IdClienteFidely>77</IdClienteFidely>');
    expect(result.response).toContain('<Sucursal>SUC-01</Sucursal>');
    expect(result.response).toContain('<FecNac>1990-01-01</FecNac>');
  });

  it('lanza error si FechaDesde no tiene el formato esperado', async () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB>' +
      '<CodAccion>302</CodAccion>' +
      '<FechaDesde>2026-03-01</FechaDesde>' +
      '<FechaHasta>06/03/2026 23:59:59</FechaHasta>' +
      '</MensajeFidelyGB>';

    await expect(adapter.handle(xml, 'SUC-01')).rejects.toThrow(
      'FechaDesde invalida. Formato esperado: dd/mm/yyyy HH:nn:ss',
    );
  });
});
