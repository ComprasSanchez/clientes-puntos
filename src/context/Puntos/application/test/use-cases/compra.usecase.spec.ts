/* eslint-disable @typescript-eslint/unbound-method */
// src/application/usecases/CompraUseCase.spec.ts
import { OpTipo } from 'src/shared/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { CompraUseCase } from '../../use-cases/Compra/Compra';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionId } from 'src/context/Puntos/core/value-objects/OperacionId';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from 'src/context/Puntos/core/value-objects/ReferenciaMovimiento';

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
      clienteId: 'client-1',
      origenTipo: origen,
      puntos: 10,
      montoMoneda: 100,
      moneda: 'ARS',
      referencia: ref,
    };
    const fakeResp: CreateOperacionResponse = {
      operacionId: opId,
      lotesAfectados: [new LoteId('l1')],
      transacciones: [],
    };
    service.execute.mockResolvedValue(fakeResp);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith({
      clienteId: 'client-1',
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
