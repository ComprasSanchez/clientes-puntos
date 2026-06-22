import { ClienteFindByTarjeta } from '@cliente/application/use-cases/ClienteFindByTarjeta/ClienteFindByTarjeta';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { ReglaFindCotizacion } from '@regla/application/use-cases/ReglaFindCotizacion/FindCotizacion';
import { ClientesFsaClient } from '@infrastructure/integrations/CLIENTES/services/clientes-fsa.client';
import { ConsultarClientePlexAdapter } from './consultar-cliente.adapter';

describe('ConsultarClientePlexAdapter', () => {
  let findByTarjeta: { run: jest.Mock };
  let saldoService: { run: jest.Mock };
  let reglaFindCotizacion: { run: jest.Mock };
  let clientesFsaClient: Partial<ClientesFsaClient>;
  let adapter: ConsultarClientePlexAdapter;

  const previousCampania = process.env.CAMPANIA_ID;

  beforeEach(() => {
    process.env.CAMPANIA_ID = '77';

    findByTarjeta = { run: jest.fn() };
    saldoService = { run: jest.fn() };
    reglaFindCotizacion = { run: jest.fn() };
    clientesFsaClient = {
      findByExternalId: jest.fn().mockResolvedValue(null),
      findByDni: jest.fn().mockResolvedValue(null),
      findProfileById: jest.fn().mockResolvedValue(null),
    };

    adapter = new ConsultarClientePlexAdapter(
      findByTarjeta as unknown as ClienteFindByTarjeta,
      saldoService as unknown as ObtenerSaldo,
      reglaFindCotizacion as unknown as ReglaFindCotizacion,
      clientesFsaClient as unknown as ClientesFsaClient,
    );
  });

  afterAll(() => {
    process.env.CAMPANIA_ID = previousCampania;
  });

  it('retorna XML de consulta para codAccion 300', async () => {
    findByTarjeta.run.mockResolvedValue({
      id: 'cli-1',
      idFidely: 900,
      categoria: 3,
      nombre: 'Ana',
      apellido: 'Lopez',
      fechaNacimiento: '1988-05-10',
      dni: '28999111',
      telefono: '1111',
      direccion: 'Calle 1',
      email: 'ana@mail.com',
      sexo: 'F',
      codPostal: '5000',
    });
    saldoService.run.mockResolvedValue(120);
    reglaFindCotizacion.run.mockResolvedValue({ rateSpendVo: { value: 2 } });

    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB><CodAccion>300</CodAccion><NroTarjeta>999</NroTarjeta></MensajeFidelyGB>';

    const result = await adapter.handle(xml);

    expect(findByTarjeta.run).toHaveBeenCalledWith('999');
    expect(result.response).toContain('<RespCode>0</RespCode>');
    expect(result.response).toContain('<IdClienteFidely>900</IdClienteFidely>');
    expect(result.response).toContain('<Puntos>120</Puntos>');
    expect(result.response).toContain('<ValorPunto>0.5</ValorPunto>');
    expect(result.response).toContain('<FecNac>10/05/1988</FecNac>');
  });

  it('convierte FecNac de ISO a formato PLEX dd/mm/yyyy', async () => {
    findByTarjeta.run.mockResolvedValue({
      id: 'cli-2',
      idFidely: 1,
      categoria: 1,
      nombre: 'Juan',
      apellido: 'Perez',
      fechaNacimiento: '2012-06-14',
      dni: '17842496',
      telefono: '',
      direccion: '',
      email: '',
      sexo: 'M',
      codPostal: '',
    });
    saldoService.run.mockResolvedValue(0);
    reglaFindCotizacion.run.mockResolvedValue({ rateSpendVo: { value: 1 } });

    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB><CodAccion>300</CodAccion><NroTarjeta>123</NroTarjeta></MensajeFidelyGB>';

    const result = await adapter.handle(xml);

    expect(result.response).toContain('<FecNac>14/06/2012</FecNac>');
    expect(result.response).not.toContain('<FecNac>2012-06-14</FecNac>');
  });

  it('rechaza codAccion no soportado', async () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB><CodAccion>999</CodAccion><NroTarjeta>999</NroTarjeta></MensajeFidelyGB>';

    await expect(adapter.handle(xml)).rejects.toThrow(
      'Acción no soportada: 999',
    );
  });
});
