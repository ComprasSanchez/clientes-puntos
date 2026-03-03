/* eslint-disable @typescript-eslint/unbound-method */
import { OpTipo } from '@shared/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { AnulacionUseCase } from '../../use-cases/Anulacion/Anulacion';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { MetricasQueueService } from 'src/context/Metricas/infrastructure/MetricasQueue/MetricasQueueService';

describe('AnulacionUseCase', () => {
  let service: jest.Mocked<CreateOperacionService>;
  let metricasQueue: jest.Mocked<MetricasQueueService>;
  let useCase: AnulacionUseCase;

  beforeEach(() => {
    service = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateOperacionService>;
    metricasQueue = {
      crearMetricaCliente: jest.fn(),
    } as unknown as jest.Mocked<MetricasQueueService>;
    useCase = new AnulacionUseCase(service, metricasQueue);
  });

  it('mapea OperacionDto de anulacion y delega en servicio central', async () => {
    const input: OperacionDto = {
      clienteId: '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
      origenTipo: 'TEST',
      puntos: 20,
      montoMoneda: 200,
      moneda: 'ARS',
      referencia: 'ref-3',
      refOperacion: 123456789,
    };
    const fakeResp = {
      handlerResult: {
        operacion: { id: { value: 1003 } } as unknown as Operacion,
        transacciones: [{ id: { value: 'tx-3' } }] as unknown as Transaccion[],
        lotesActualizados: [],
        saldoAnterior: 120,
        saldoNuevo: 100,
      },
      lotesAfectados: [],
      transacciones: [],
    } as CreateOperacionResponse;
    service.execute.mockResolvedValue(fakeResp);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith(
      {
        clienteId: input.clienteId,
        tipo: OpTipo.ANULACION,
        origenTipo: new OrigenOperacion('TEST'),
        puntos: 20,
        montoMoneda: 200,
        moneda: 'ARS',
        referencia: new ReferenciaMovimiento('ref-3'),
        operacionId: OperacionId.instance(123456789),
        codSucursal: undefined,
        productos: undefined,
      },
      undefined,
    );
    expect(metricasQueue.crearMetricaCliente).toHaveBeenCalledWith(
      fakeResp.handlerResult.operacion,
      fakeResp.handlerResult.transacciones,
    );
    expect(result).toBe(fakeResp);
  });
});
