/* eslint-disable @typescript-eslint/unbound-method */
// test/application/use-cases/devolver-puntos.usecase.spec.ts

import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';
import { CreateTransaccionService } from 'src/context/Puntos/application/services/CreateTransaccionService';
import { DevolverDto } from 'src/context/Puntos/application/dtos/DevolverDto';
import { FakeUUIDGen } from 'src/shared/core/uuid/test/stubs/FakeUUIDGenerator';
import { Lote } from 'src/context/Puntos/core/entities/Lote';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { TimestampId } from 'src/context/Puntos/core/value-objects/TimestampId';
import { BatchEstado } from 'src/context/Puntos/core/enums/BatchEstado';
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';
import { LoteNotFoundError } from 'src/context/Puntos/core/exceptions/Lote/LoteNotFoundError';
import { DevolverPuntosUseCase } from '../../use-cases/Devolver/DevolverPuntos';

describe('DevolverPuntosUseCase', () => {
  let loteRepo: jest.Mocked<LoteRepository>;
  let txRepo: jest.Mocked<TransaccionRepository>;
  let createTx: CreateTransaccionService;
  let runSpy: jest.SpyInstance<
    Promise<TimestampId>,
    [Parameters<CreateTransaccionService['run']>[0]]
  >;
  let useCase: DevolverPuntosUseCase;

  beforeEach(() => {
    loteRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCliente: jest.fn(),
      save: jest.fn(),
      update: jest.fn<Promise<void>, [Lote]>(),
      delete: jest.fn(),
    };

    txRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCliente: jest.fn(),
      findByLote: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const idGen = new FakeUUIDGen();
    createTx = new CreateTransaccionService(txRepo, idGen);
    runSpy = jest
      .spyOn(createTx, 'run')
      .mockResolvedValue(new TimestampId(999));

    useCase = new DevolverPuntosUseCase(loteRepo, createTx);
  });

  it('debe crear transacción de devolución y actualizar el lote', async () => {
    const clienteId = 'cliente-123';
    const referencia = 'ref-1';
    // Lote con remaining = 50
    const lote = new Lote(
      new LoteId('11111111-1111-4111-8111-111111111111'),
      new ClienteId(clienteId),
      new CantidadPuntos(100),
      new CantidadPuntos(50),
      BatchEstado.DISPONIBLE,
      new Date(),
      null,
      new OrigenOperacion('test'),
      undefined,
    );
    loteRepo.findByCliente.mockResolvedValue([lote]);

    const input: DevolverDto = {
      clienteId,
      loteId: lote.id.value,
      puntos: 20,
      referenciaId: referencia,
    };
    await useCase.run(input);

    // 1) Se debe llamar a createTx.run una vez con los valores correctos
    expect(runSpy).toHaveBeenCalledTimes(1);
    const txArg = runSpy.mock.calls[0][0];
    expect(txArg.loteId.value).toBe(lote.id.value);
    expect(txArg.tipo).toBe(TxTipo.DEVOLUCION);
    expect(txArg.cantidad.value).toBe(20);
    expect(txArg.referenciaId?.value).toBe(referencia);

    // 2) El lote debe tener remaining incrementado
    expect(lote.remaining.value).toBe(70);

    // 3) Se debe llamar a loteRepo.update con el lote modificado
    expect(loteRepo.update).toHaveBeenCalledTimes(1);
    expect(loteRepo.update).toHaveBeenCalledWith(lote);
  });

  it('lanza LoteNotFoundError si el lote no existe', async () => {
    loteRepo.findByCliente.mockResolvedValue([]);
    const input: DevolverDto = {
      clienteId: 'cliente-456',
      loteId: 'no-existe',
      puntos: 10,
      referenciaId: 'ref-2',
    };
    await expect(useCase.run(input)).rejects.toBeInstanceOf(LoteNotFoundError);
    expect(runSpy).not.toHaveBeenCalled();
    expect(loteRepo.update).not.toHaveBeenCalled();
  });
});
