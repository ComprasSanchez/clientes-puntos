import { ClienteFindByDni } from '@cliente/application/use-cases/ClienteFindByDni/ClienteFindByDni';
import { ObtenerSaldo } from '@puntos/application/use-cases/ObtenerSaldo/ObtenerSaldo';
import { GetMetricasCliente } from 'src/context/Metricas/application/clientes/use-cases/GetMetricasCliente';
import { ConsultarEstadisticasClientePlexAdapter } from './consultar-estadisticas-cliente.adapter';

describe('ConsultarEstadisticasClientePlexAdapter', () => {
  let clienteFindByDni: { run: jest.Mock };
  let saldoService: { run: jest.Mock };
  let metricaUseCase: { run: jest.Mock };
  let adapter: ConsultarEstadisticasClientePlexAdapter;

  beforeEach(() => {
    clienteFindByDni = { run: jest.fn() };
    saldoService = { run: jest.fn() };
    metricaUseCase = { run: jest.fn() };

    adapter = new ConsultarEstadisticasClientePlexAdapter(
      clienteFindByDni as unknown as ClienteFindByDni,
      saldoService as unknown as ObtenerSaldo,
      metricaUseCase as unknown as GetMetricasCliente,
    );
  });

  it('retorna estadísticas para codAccion 301', async () => {
    clienteFindByDni.run.mockResolvedValue({
      id: 'cli-1',
      idFidely: 88,
      categoria: 2,
    });
    saldoService.run.mockResolvedValue(300);
    metricaUseCase.run.mockResolvedValue({
      pesosAhorroUltimoMes: 100,
      pesosAhorro3Meses: 250,
      puntosUltimoMes: 10,
      puntos3Meses: 25,
      movimientosUltimoMes: 2,
      movimientos3Meses: 8,
    });

    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB><CodAccion>301</CodAccion><DNI>30111222</DNI></MensajeFidelyGB>';

    const result = await adapter.handle(xml);

    expect(clienteFindByDni.run).toHaveBeenCalledWith('30111222');
    expect(result.response).toContain('<RespCode>0</RespCode>');
    expect(result.response).toContain('<IdClienteFidely>88</IdClienteFidely>');
    expect(result.response).toContain(
      '<Movimientos3Meses>8</Movimientos3Meses>',
    );
  });

  it('lanza error si no se envía DNI', async () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<MensajeFidelyGB><CodAccion>301</CodAccion></MensajeFidelyGB>';

    await expect(adapter.handle(xml)).rejects.toThrow(
      'DNI no especificado en el XML.',
    );
  });
});
