/* eslint-disable @typescript-eslint/unbound-method */
// test/application/use-cases/gastar-puntos.usecase.spec.ts

import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';
import { CreateTransaccionService } from 'src/context/Puntos/application/services/CreateTransaccionService';
import { GastarDto } from 'src/context/Puntos/application/dtos/GastarDto';
import { FakeUUIDGen } from 'src/shared/core/uuid/test/stubs/FakeUUIDGenerator';
import { Lote } from 'src/context/Puntos/core/entities/Lote';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { BatchEstado } from 'src/context/Puntos/core/enums/BatchEstado';
import { TimestampId } from 'src/context/Puntos/core/value-objects/TimestampId';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';
import { GastarPuntosUseCase } from '../../use-cases/Gastar/GastarPuntos';

describe('GastarPuntosUseCase', () => {
  let loteRepo: jest.Mocked<LoteRepository>;
  let txRepo: jest.Mocked<TransaccionRepository>;
  let createTx: CreateTransaccionService;
  let runSpy: jest.SpyInstance<
    Promise<TimestampId>,
    [Parameters<CreateTransaccionService['run']>[0]]
  >;
  let useCase: GastarPuntosUseCase;

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
      .mockResolvedValue(new TimestampId(123));

    useCase = new GastarPuntosUseCase(loteRepo, createTx);
  });

  it('consume todos los puntos de un solo lote y crea una transacción GASTO', async () => {
    const clienteId = 'cliente-123';
    const puntos = 50;
    const referenciaId = 'ref-1';

    // Creamos un lote con remaining = puntos
    const lote1 = new Lote(
      new LoteId('11111111-1111-4111-8111-111111111111'),
      new ClienteId(clienteId),
      new CantidadPuntos(puntos),
      new CantidadPuntos(puntos),
      BatchEstado.DISPONIBLE,
      new Date(),
      null,
      new OrigenOperacion('test'),
      undefined,
    );
    loteRepo.findByCliente.mockResolvedValue([lote1]);

    const input: GastarDto = { clienteId, puntos, referenciaId };
    await useCase.run(input);

    // 1) createTx.run debe haberse llamado una vez
    expect(runSpy).toHaveBeenCalledTimes(1);
    const txArg = runSpy.mock.calls[0][0];
    expect(txArg.loteId.value).toBe(lote1.id.value);
    expect(txArg.tipo).toBe(TxTipo.GASTO);
    expect(txArg.cantidad.value).toBe(puntos);
    expect(txArg.referenciaId?.value).toBe(referenciaId);

    // 2) loteRepo.update debe haberse llamado con el mismo lote modificado
    expect(loteRepo.update).toHaveBeenCalledTimes(1);
    expect(loteRepo.update).toHaveBeenCalledWith(lote1);
  });

  it('dispara varias transacciones si el saldo abarca varios lotes', async () => {
    const clienteId = 'cliente-456';
    const referencia = 'ref-2';
    // Lote A con 30, Lote B con 40
    const loteA = new Lote(
      new LoteId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
      new ClienteId(clienteId),
      new CantidadPuntos(30),
      new CantidadPuntos(30),
      BatchEstado.DISPONIBLE,
      new Date(),
      null,
      new OrigenOperacion('test'),
      undefined,
    );
    const loteB = new Lote(
      new LoteId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
      new ClienteId(clienteId),
      new CantidadPuntos(40),
      new CantidadPuntos(40),
      BatchEstado.DISPONIBLE,
      new Date(),
      null,
      new OrigenOperacion('test'),
      undefined,
    );
    loteRepo.findByCliente.mockResolvedValue([loteA, loteB]);

    const puntos = 50;
    const input: GastarDto = { clienteId, puntos, referenciaId: referencia };
    await useCase.run(input);

    // Deben generarse 2 transacciones: 30 del loteA y 20 del loteB
    expect(runSpy).toHaveBeenCalledTimes(2);
    // Primera llamada
    const first = runSpy.mock.calls[0][0];
    expect(first.loteId.value).toBe(loteA.id.value);
    expect(first.cantidad.value).toBe(30);

    const second = runSpy.mock.calls[1][0];
    expect(second.loteId.value).toBe(loteB.id.value);
    expect(second.cantidad.value).toBe(20);

    // Actualizar ambos lotes
    expect(loteRepo.update).toHaveBeenCalledTimes(2);
    expect(loteRepo.update).toHaveBeenCalledWith(loteA);
    expect(loteRepo.update).toHaveBeenCalledWith(loteB);
  });
});
