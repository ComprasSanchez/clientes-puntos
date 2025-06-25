/* eslint-disable @typescript-eslint/unbound-method */
// src/application/usecases/CompraUseCase.spec.ts
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';
import { OpTipo } from 'src/shared/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { CompraUseCase } from '../../use-cases/Compra/Compra';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionId } from 'src/context/Puntos/core/value-objects/OperacionId';

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
    const origen = new OrigenOperacion('TEST');
    const input: OperacionDto = {
      clienteId: 'client-1',
      origenTipo: origen,
      puntos: 10,
      montoMoneda: 100,
      moneda: 'ARS',
      referencia: 'ref-1',
    };
    const fakeResp: CreateOperacionResponse = {
      operacionId: Number(OperacionId.create()),
      lotesAfectados: ['l1'],
      transacciones: [],
    };
    service.execute.mockResolvedValue(fakeResp);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith({
      ...input,
      tipo: OpTipo.COMPRA,
    });
    expect(result).toBe(fakeResp);
  });
});
