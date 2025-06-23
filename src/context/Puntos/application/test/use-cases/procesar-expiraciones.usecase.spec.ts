/* eslint-disable @typescript-eslint/unbound-method */
// test/application/use-cases/procesar-expiraciones.usecase.spec.ts

import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';
import { CreateTransaccionService } from 'src/context/Puntos/application/services/CreateTransaccionService';
import { FakeUUIDGen } from 'src/shared/core/uuid/test/stubs/FakeUUIDGenerator';
import { Lote } from 'src/context/Puntos/core/entities/Lote';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { ClienteId } from 'src/context/Cliente/core/value-objects/ClienteId';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { BatchEstado } from 'src/context/Puntos/core/enums/BatchEstado';
import { FechaExpiracion } from 'src/context/Puntos/core/value-objects/FechaExpiracion';
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { TimestampId } from 'src/context/Puntos/core/value-objects/TimestampId';
import { ProcesarExpiracionesUseCase } from '../../use-cases/ProcesarExpiraciones/ProcesarExpiraciones';

describe('ProcesarExpiracionesUseCase', () => {
  let loteRepo: jest.Mocked<LoteRepository>;
  let txRepo: jest.Mocked<TransaccionRepository>;
  let createTx: CreateTransaccionService;
  let runSpy: jest.SpyInstance<
    Promise<TimestampId>,
    [Parameters<CreateTransaccionService['run']>[0]]
  >;
  let useCase: ProcesarExpiracionesUseCase;

  beforeEach(() => {
    loteRepo = {
      findAll: jest.fn(),
      findByCliente: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn<Promise<void>, [Lote]>(),
      delete: jest.fn(),
    };

    txRepo = {
      findAll: jest.fn(),
      findByCliente: jest.fn(),
      findById: jest.fn(),
      findByLote: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const idGen = new FakeUUIDGen();
    createTx = new CreateTransaccionService(txRepo, idGen);
    runSpy = jest.spyOn(createTx, 'run').mockResolvedValue(new TimestampId(42));

    useCase = new ProcesarExpiracionesUseCase(loteRepo, createTx);
  });

  it('no hace nada si no hay lotes expirados', async () => {
    // Lote sin expiración
    const loteVigente = new Lote(
      new LoteId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
      new ClienteId('cliente-1'),
      new CantidadPuntos(100),
      new CantidadPuntos(100),
      BatchEstado.DISPONIBLE,
      new Date(),
      null,
      new OrigenOperacion('test'),
      undefined,
    );
    loteRepo.findAll.mockResolvedValue([loteVigente]);

    await useCase.run();

    expect(runSpy).not.toHaveBeenCalled();
    expect(loteRepo.update).not.toHaveBeenCalled();
  });

  it('procesa expiraciones: crea transacciones y actualiza lotes expirados', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1000 * 60 * 60 * 24); // ayer
    const loteExp = new Lote(
      new LoteId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
      new ClienteId('cliente-2'),
      new CantidadPuntos(50),
      new CantidadPuntos(50),
      BatchEstado.DISPONIBLE,
      new Date(now.getTime() - 1000 * 60 * 60 * 48), // creado hace 2 días
      new FechaExpiracion(past),
      new OrigenOperacion('test'),
      undefined,
    );
    // otro cliente con un lote expirado también
    const loteExp2 = new Lote(
      new LoteId('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      new ClienteId('cliente-2'),
      new CantidadPuntos(20),
      new CantidadPuntos(20),
      BatchEstado.DISPONIBLE,
      new Date(now.getTime() - 1000 * 60 * 60 * 72),
      new FechaExpiracion(past),
      new OrigenOperacion('app'),
      undefined,
    );
    loteRepo.findAll.mockResolvedValue([loteExp, loteExp2]);

    await useCase.run();

    // Debe llamar a run() dos veces (una por lote expirado)
    expect(runSpy).toHaveBeenCalledTimes(2);
    // Primera transacción
    const firstArg = runSpy.mock.calls[0][0];
    expect(firstArg.loteId.value).toBe(loteExp.id.value);
    expect(firstArg.tipo).toBe(TxTipo.EXPIRACION);
    expect(firstArg.cantidad.value).toBe(loteExp.remaining.value);
    // Segunda transacción
    const secondArg = runSpy.mock.calls[1][0];
    expect(secondArg.loteId.value).toBe(loteExp2.id.value);
    expect(secondArg.tipo).toBe(TxTipo.EXPIRACION);
    expect(secondArg.cantidad.value).toBe(loteExp2.remaining.value);

    // Actualizar ambos lotes expirados
    expect(loteRepo.update).toHaveBeenCalledTimes(2);
    expect(loteRepo.update).toHaveBeenCalledWith(loteExp);
    expect(loteRepo.update).toHaveBeenCalledWith(loteExp2);
  });
});
