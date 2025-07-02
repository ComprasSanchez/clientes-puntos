/* eslint-disable @typescript-eslint/unbound-method */
// src/application/usecases/CompraUseCase.spec.ts
import { OpTipo } from '@shared/core/enums/OpTipo';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { OperacionDto } from '../../dtos/OperacionDto';
import { CreateOperacionResponse } from '../../dtos/CreateOperacionResponse';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { AnulacionUseCase } from '../../use-cases/Anulacion/Anulacion';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';

describe('CompraUseCase', () => {
  let service: jest.Mocked<CreateOperacionService>;
  let useCase: AnulacionUseCase;

  beforeEach(() => {
    service = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateOperacionService>;
    useCase = new AnulacionUseCase(service);
  });

  it('debe invocar service.execute con OpTipo.ANULACION y devolver su respuesta', async () => {
    const origen = 'TEST';
    const ref = 'ref-3';
    const input: OperacionDto = {
      clienteId: 'client-3',
      origenTipo: origen,
      puntos: 20,
      montoMoneda: 200,
      moneda: 'ARS',
      referencia: ref,
      refOperacion: 123456789,
    };
    const fakeResp: CreateOperacionResponse = {
      operacionId: Number(OperacionId.create()),
      lotesAfectados: [new LoteId('I3')],
      transacciones: [],
    };
    service.execute.mockResolvedValue(fakeResp);

    const result = await useCase.run(input);

    expect(service.execute).toHaveBeenCalledWith({
      clienteId: 'client-3',
      tipo: OpTipo.ANULACION,
      origenTipo: new OrigenOperacion(origen),
      puntos: 20,
      montoMoneda: 200,
      moneda: 'ARS',
      referencia: new ReferenciaMovimiento(ref),
      operacionId: OperacionId.instance(123456789),
    });
    expect(result).toBe(fakeResp);
  });
});
