/* eslint-disable @typescript-eslint/unbound-method */
import { OpTipo } from '@shared/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { CompraUseCase } from '../../use-cases/Compra/Compra';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { MetricasQueueService } from 'src/context/Metricas/infrastructure/MetricasQueue/MetricasQueueService';

describe('CompraUseCase', () => {
  let service: jest.Mocked<CreateOperacionService>;
  let metricasQueue: jest.Mocked<MetricasQueueService>;
  let useCase: CompraUseCase;

  beforeEach(() => {
    service = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateOperacionService>;
    metricasQueue = {
      crearMetricaCliente: jest.fn(),
    } as unknown as jest.Mocked<MetricasQueueService>;
    useCase = new CompraUseCase(service, metricasQueue);
  });

  it('mapea OperacionDto a request interno y delega en CreateOperacionService', async () => {
    const input: OperacionDto = {
      clienteId: '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
      origenTipo: 'TEST',
      puntos: 10,
      montoMoneda: 100,
      moneda: 'ARS',
      referencia: 'ref-1',
      productos: [{ codExt: 123, cantidad: 0, precio: 125.5 }],
    };
    const fakeResponse = {
      handlerResult: {
        operacion: { id: { value: 1001 } } as unknown as Operacion,
        transacciones: [{ id: { value: 'tx-1' } }] as unknown as Transaccion[],
        lotesActualizados: [],
        saldoAnterior: 0,
        saldoNuevo: 10,
      },
      lotesAfectados: [],
      transacciones: [],
      puntosDebito: 0,
      puntosCredito: 10,
    } as CreateOperacionResponse;
    service.execute.mockResolvedValue(fakeResponse);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith(
      {
        clienteId: input.clienteId,
        tipo: OpTipo.COMPRA,
        origenTipo: new OrigenOperacion('TEST'),
        puntos: 10,
        montoMoneda: 100,
        moneda: 'ARS',
        referencia: new ReferenciaMovimiento('ref-1'),
        operacionId: undefined,
        codSucursal: undefined,
        productos: [{ codExt: 123, cantidad: 1, precio: 125.5 }],
      },
      undefined,
    );
    expect(metricasQueue.crearMetricaCliente).toHaveBeenCalledWith(
      fakeResponse.handlerResult.operacion,
      fakeResponse.handlerResult.transacciones,
    );
    expect(result).toBe(fakeResponse);
  });
});
