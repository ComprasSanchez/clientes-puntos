/* eslint-disable @typescript-eslint/unbound-method */
// src/application/usecases/CompraUseCase.spec.ts
import { OpTipo } from '@shared/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { CompraUseCase } from '../../use-cases/Compra/Compra';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';

describe('CompraUseCase', () => {
  let service: jest.Mocked<CreateOperacionService>;
  let useCase: CompraUseCase;

  beforeEach(() => {
    service = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateOperacionService>;
    useCase = new CompraUseCase(service);
  });

  it('debe invocar service.execute con OpTipo.COMPRA y devolver su respuesta', async () => {
    const origen = 'TEST';
    const ref = 'ref-1';
    const opId = Number(OperacionId.create());
    const input: OperacionDto = {
      clienteId: '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
      origenTipo: origen,
      puntos: 10,
      montoMoneda: 100,
      moneda: 'ARS',
      referencia: ref,
    };
    const fakeResp: CreateOperacionResponse = {
      operacionId: opId,
      lotesAfectados: [new LoteId('42d27718-7c8f-4f15-a8df-d4bfe45bcd54')],
      transacciones: [],
    };
    service.execute.mockResolvedValue(fakeResp);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith({
      clienteId: '42d27718-7c8f-4f15-a8df-d4bfe45bcd54',
      tipo: OpTipo.COMPRA,
      origenTipo: new OrigenOperacion(origen),
      puntos: 10,
      montoMoneda: 100,
      moneda: 'ARS',
      referencia: new ReferenciaMovimiento(ref),
      operacionId: undefined,
    });
    expect(result).toBe(fakeResp);
  });
});
