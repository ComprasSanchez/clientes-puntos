/* eslint-disable @typescript-eslint/unbound-method */
// src/application/usecases/CompraUseCase.spec.ts
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';
import { OpTipo } from 'src/context/Puntos/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionId } from 'src/context/Puntos/core/value-objects/OperacionId';
import { DevolucionUseCase } from '../../use-cases/Devolucion/Devolucion';

describe('CompraUseCase', () => {
  let service: jest.Mocked<CreateOperacionService>;
  let useCase: DevolucionUseCase;

  beforeEach(() => {
    service = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateOperacionService>;
    useCase = new DevolucionUseCase(service);
  });

  it('debe invocar service.execute con OpTipo.COMPRA y devolver su respuesta', async () => {
    const origen = new OrigenOperacion('TEST');
    const input: OperacionDto = {
      clienteId: 'client-2',
      origenTipo: origen,
      puntos: 5,
      montoMoneda: 50,
      moneda: 'USD',
      referencia: 'ref-2',
    };
    const fakeResp: CreateOperacionResponse = {
      operacionId: Number(OperacionId.create()),
      lotesAfectados: ['I2'],
      transacciones: [],
    };
    service.execute.mockResolvedValue(fakeResp);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith({
      ...input,
      tipo: OpTipo.DEVOLUCION,
    });
    expect(result).toBe(fakeResp);
  });
});
