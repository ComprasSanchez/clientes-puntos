/* eslint-disable @typescript-eslint/unbound-method */
// src/application/usecases/CompraUseCase.spec.ts
import { OpTipo } from '@shared/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { DevolucionUseCase } from '../../use-cases/Devolucion/Devolucion';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';

describe('CompraUseCase', () => {
  let service: jest.Mocked<CreateOperacionService>;
  let useCase: DevolucionUseCase;

  beforeEach(() => {
    service = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateOperacionService>;
    useCase = new DevolucionUseCase(service);
  });

  it('debe invocar service.execute con OpTipo.DEVOLUCION y devolver su respuesta', async () => {
    const origen = 'TEST';
    const ref = 'ref-2';
    const input: OperacionDto = {
      clienteId: '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
      origenTipo: origen,
      puntos: 5,
      montoMoneda: 50,
      moneda: 'USD',
      referencia: 'ref-2',
      refOperacion: 123456789,
    };
    const fakeResp: CreateOperacionResponse = {
      operacionId: Number(OperacionId.create()),
      lotesAfectados: [new LoteId('42d27718-7c8f-4f15-a8df-d4bfe45bcd54')],
      transacciones: [],
    };
    service.execute.mockResolvedValue(fakeResp);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith({
      clienteId: '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
      tipo: OpTipo.DEVOLUCION,
      origenTipo: new OrigenOperacion(origen),
      puntos: 5,
      montoMoneda: 50,
      moneda: 'USD',
      referencia: new ReferenciaMovimiento(ref),
      operacionId: OperacionId.instance(123456789),
    });
    expect(result).toBe(fakeResp);
  });
});
