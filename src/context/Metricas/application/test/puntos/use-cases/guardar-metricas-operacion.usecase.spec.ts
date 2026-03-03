import { GuardarMetricasOperacion } from 'src/context/Metricas/application/puntos/use-cases/GuardarMetricasOperacion';
import { MetricasOperacionRepository } from 'src/context/Metricas/core/puntos/repositories/MetricasOperacionRepository';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { CalcularMetricasOperacionService } from 'src/context/Metricas/core/puntos/services/calcularMetricasOperacionService';
import { FechaDiaRange } from 'src/context/Metricas/application/puntos/value-objects/FechaDiaRange';
import { MetricasOperacion } from 'src/context/Metricas/core/puntos/entities/MetricasOperacion';

describe('GuardarMetricasOperacion', () => {
  let metricasRepo: jest.Mocked<MetricasOperacionRepository>;
  let operacionRepo: jest.Mocked<OperacionRepository>;
  let transaccionRepo: jest.Mocked<TransaccionRepository>;
  let calc: jest.Mocked<CalcularMetricasOperacionService>;
  let useCase: GuardarMetricasOperacion;

  beforeEach(() => {
    metricasRepo = {
      save: jest.fn(),
      findByFecha: jest.fn(),
      findBetweenFechas: jest.fn(),
    };
    operacionRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCliente: jest.fn(),
      findByReferencia: jest.fn(),
      findBetween: jest.fn(),
      findByFecha: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    transaccionRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByLote: jest.fn(),
      findByCliente: jest.fn(),
      findByOperationId: jest.fn(),
      findByOperacionIds: jest.fn(),
      findByReferencia: jest.fn(),
      findBetween: jest.fn(),
      findByFecha: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    calc = {
      calcular: jest.fn(),
    } as unknown as jest.Mocked<CalcularMetricasOperacionService>;

    useCase = new GuardarMetricasOperacion(
      metricasRepo,
      operacionRepo,
      transaccionRepo,
      calc,
    );
  });

  it('busca datos del rango, calcula y persiste', async () => {
    const range = new FechaDiaRange(
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-01T23:59:59.999Z'),
    );
    const ops = [{ tipo: 'compra' }];
    const txs = [{ tipo: 'ACREDITACION' }];
    const metrica = new MetricasOperacion(new Date(range.startUtc), 1, 10, 0, {
      compra: 1,
      devolucion: 0,
      anulacion: 0,
      ajuste: 0,
    });

    operacionRepo.findBetween.mockResolvedValue(ops as never);
    transaccionRepo.findBetween.mockResolvedValue(txs as never);
    calc.calcular.mockReturnValue(metrica);

    await useCase.run(range);

    expect(operacionRepo.findBetween).toHaveBeenCalledWith(
      range.startUtc,
      range.endUtc,
    );
    expect(transaccionRepo.findBetween).toHaveBeenCalledWith(
      range.startUtc,
      range.endUtc,
    );
    expect(calc.calcular).toHaveBeenCalledWith(ops, txs, range.startUtc);
    expect(metricasRepo.save).toHaveBeenCalledWith(metrica);
  });
});
