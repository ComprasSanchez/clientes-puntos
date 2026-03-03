import { CargarMetricasSaldo } from 'src/context/Metricas/application/puntos/use-cases/CargarMetricasSaldo';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CalcularMetricasSaldoService } from 'src/context/Metricas/core/puntos/services/calcularMetricasSaldoService';
import { MetricasSaldo } from 'src/context/Metricas/core/puntos/entities/MetricasSaldo';

describe('CargarMetricasSaldo', () => {
  let saldoRepo: jest.Mocked<SaldoRepository>;
  let clienteRepo: jest.Mocked<ClienteRepository>;
  let calc: jest.Mocked<CalcularMetricasSaldoService>;
  let useCase: CargarMetricasSaldo;

  beforeEach(() => {
    saldoRepo = {
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      updateSaldo: jest.fn(),
      delete: jest.fn(),
      saveHistorial: jest.fn(),
      findHistorialByClienteId: jest.fn(),
    };
    clienteRepo = {
      findAll: jest.fn(),
      countAll: jest.fn(),
      findById: jest.fn(),
      findByDni: jest.fn(),
      findByNroTarjeta: jest.fn(),
      findByIdFidely: jest.fn(),
      existsByTarjetaFidely: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findPagedByIdAsc: jest.fn(),
    };
    calc = {
      run: jest.fn(),
    } as unknown as jest.Mocked<CalcularMetricasSaldoService>;

    useCase = new CargarMetricasSaldo(saldoRepo, clienteRepo, calc);
  });

  it('consulta repositorios y retorna las metricas calculadas', async () => {
    const saldos = [{ clienteId: '1', puntos: { value: 100 } }];
    const expected = new MetricasSaldo(100, 100, 1, 1);

    saldoRepo.findAll.mockResolvedValue(saldos as never);
    clienteRepo.countAll.mockResolvedValue(1);
    calc.run.mockReturnValue(expected);

    const result = await useCase.run();

    expect(saldoRepo.findAll).toHaveBeenCalledTimes(1);
    expect(clienteRepo.countAll).toHaveBeenCalledTimes(1);
    expect(calc.run).toHaveBeenCalledWith(saldos, 1);
    expect(result).toBe(expected);
  });
});
