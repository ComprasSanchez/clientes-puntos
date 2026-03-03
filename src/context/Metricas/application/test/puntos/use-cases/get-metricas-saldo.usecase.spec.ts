import { GetMetricasSaldo } from 'src/context/Metricas/application/puntos/use-cases/GetMetricasSaldo';
import { SaldoMetricasCacheLoader } from '@infrastructure/cache/saldo-cache/saldo-cache.loader';
import { MetricasSaldo } from 'src/context/Metricas/core/puntos/entities/MetricasSaldo';

describe('GetMetricasSaldo', () => {
  it('retorna las metricas provistas por el cache loader', async () => {
    const expected = new MetricasSaldo(500, 100, 10, 5);
    const loader = {
      getMetricasSaldo: jest.fn().mockResolvedValue(expected),
    } as unknown as jest.Mocked<SaldoMetricasCacheLoader>;

    const useCase = new GetMetricasSaldo(loader);
    const result = await useCase.run();

    expect(loader.getMetricasSaldo).toHaveBeenCalledTimes(1);
    expect(result).toBe(expected);
  });
});
