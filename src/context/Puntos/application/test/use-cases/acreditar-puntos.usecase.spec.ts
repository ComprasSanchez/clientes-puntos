/* eslint-disable @typescript-eslint/unbound-method */
import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { CreateTransaccionService } from 'src/context/Puntos/application/services/CreateTransaccionService';
import { AcreditarDto } from 'src/context/Puntos/application/dtos/AcreditarDto';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { BatchEstado } from 'src/context/Puntos/core/enums/BatchEstado';
import { FakeUUIDGen } from 'src/shared/core/uuid/test/stubs/FakeUUIDGenerator';
import { AcreditarPuntosUseCase } from '../../use-cases/Acreditar/AcreditarPuntos';
import { TimestampId } from 'src/context/Puntos/core/value-objects/TimestampId';
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';

describe('AcreditarPuntosUseCase', () => {
  let idGen: FakeUUIDGen;
  let loteRepo: jest.Mocked<LoteRepository>;
  let txRepo: jest.Mocked<TransaccionRepository>;
  let createTx: CreateTransaccionService;
  let runSpy: jest.SpyInstance<
    Promise<TimestampId>,
    [Parameters<CreateTransaccionService['run']>[0]]
  >;
  let useCase: AcreditarPuntosUseCase;

  beforeEach(() => {
    idGen = new FakeUUIDGen();

    loteRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCliente: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
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

    createTx = new CreateTransaccionService(txRepo, idGen);
    runSpy = jest
      .spyOn(createTx, 'run')
      .mockResolvedValue(new TimestampId(123));

    useCase = new AcreditarPuntosUseCase(idGen, loteRepo, createTx);
  });

  it('debe guardar lote y crear transacción cuando expiraEn y referenciaId están presentes', async () => {
    const input: AcreditarDto = {
      clienteId: 'cliente-123',
      cantidadOriginal: 100,
      expiraEn: '2025-07-01',
      origenTipo: 'web',
      referenciaId: 'ref-1',
    };

    await useCase.run(input);

    // 1) Verificamos loteRepo.save
    expect(loteRepo.save).toHaveBeenCalledTimes(1);
    const loteArg = loteRepo.save.mock.calls[0][0];
    expect(loteArg.id.value).toBe('00000000-0000-4000-8000-000000000000');
    expect(loteArg.clienteId.value).toBe(input.clienteId);
    expect(loteArg.cantidadOriginal.value).toBe(100);
    expect(loteArg.remaining.value).toBe(100);
    expect(loteArg.estado).toBe(BatchEstado.DISPONIBLE);
    expect(loteArg.createdAt).toEqual(expect.any(Date));
    expect(loteArg.expiraEn!.value.toISOString()).toBe(
      new Date(input.expiraEn!).toISOString(),
    );
    expect(loteArg.origenTipo.value).toBe(input.origenTipo);
    expect(loteArg.referenciaId!.value).toBe(input.referenciaId);

    // 2) Verificamos createTx.run
    expect(runSpy).toHaveBeenCalledTimes(1);
    const txArg = runSpy.mock.calls[0][0];
    expect(txArg.loteId.value).toBe('00000000-0000-4000-8000-000000000000');
    expect(txArg.tipo).toBe(TxTipo.ACREDITACION);
    expect(txArg.cantidad.value).toBe(100);
    expect(txArg.referenciaId!.value).toBe(input.referenciaId);
  });

  it('debe manejar caso sin expiraEn ni referenciaId', async () => {
    const input: AcreditarDto = {
      clienteId: 'cliente-456',
      cantidadOriginal: 50,
      expiraEn: undefined,
      origenTipo: 'api',
      referenciaId: undefined,
    };

    await useCase.run(input);

    const loteArg = loteRepo.save.mock.calls[0][0];
    expect(loteArg.expiraEn).toBeNull();
    expect(loteArg.referenciaId).toBeUndefined();

    const txArg = runSpy.mock.calls[0][0];
    expect(txArg.referenciaId).toBeUndefined();
  });
});
