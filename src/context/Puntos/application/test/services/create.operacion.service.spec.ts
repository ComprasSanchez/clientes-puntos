/* eslint-disable @typescript-eslint/unbound-method */
import { OpTipo } from 'src/context/Puntos/core/enums/OpTipo';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { LoteRepository } from 'src/context/Puntos/core/repository/LoteRepository';
import { TransaccionRepository } from 'src/context/Puntos/core/repository/TransaccionRepository';
import {
  IReglaEngine,
  ReglaEngineResult,
} from 'src/context/Puntos/core/interfaces/IReglaEngine';
import { LoteFactory } from 'src/context/Puntos/core/factories/LoteFactory';
import { TransaccionFactory } from 'src/context/Puntos/core/factories/TransaccionFactory';
import { Lote } from 'src/context/Puntos/core/entities/Lote';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { OperacionId } from 'src/context/Puntos/core/value-objects/OperacionId';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { CreateOperacionRequest } from '../../dtos/CreateOperacionRequest';
import { OrigenOperacion } from 'src/context/Puntos/core/value-objects/OrigenOperacion';
import { FakeUUIDGen } from 'src/shared/core/uuid/test/stubs/FakeUUIDGenerator';
import { BatchEstado } from 'src/context/Puntos/core/enums/BatchEstado';
import { Transaccion } from 'src/context/Puntos/core/entities/Transaccion';
import { TransaccionId } from 'src/context/Puntos/core/value-objects/TransaccionId';

describe('CreateOperacionService', () => {
  let loteRepo: jest.Mocked<LoteRepository>;
  let txRepo: jest.Mocked<TransaccionRepository>;
  let reglaEngine: jest.Mocked<IReglaEngine>;
  let loteFactory: LoteFactory;
  let txFactory: TransaccionFactory;
  let service: CreateOperacionService;
  let idGen: FakeUUIDGen;

  beforeEach(() => {
    idGen = new FakeUUIDGen();

    loteFactory = new LoteFactory(idGen);
    txFactory = new TransaccionFactory(idGen);

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
    reglaEngine = { procesar: jest.fn() };

    service = new CreateOperacionService(
      loteRepo,
      txRepo,
      reglaEngine,
      loteFactory,
      txFactory,
    );
  });

  it('should process a credit-only operation', async () => {
    // Arrange
    const now = new Date('2025-06-24T12:00:00Z');
    const origen = new OrigenOperacion('PLEX');
    const req: CreateOperacionRequest = {
      clienteId: 'client-1',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      montoMoneda: 150,
      moneda: 'ARS',
    };

    loteRepo.findByCliente.mockResolvedValue([]);

    const reglaResult: ReglaEngineResult = {
      debitos: [],
      credito: { cantidad: 75, expiraEn: now },
    };
    reglaEngine.procesar.mockResolvedValue(reglaResult);

    const loteEntity = new Lote(
      new LoteId('lote-1'),
      'client-1',
      new CantidadPuntos(75),
      new CantidadPuntos(75),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    jest.spyOn(loteFactory, 'crear').mockReturnValue(loteEntity);

    const txEntity = Transaccion.createOrphan({
      id: new TransaccionId('tx-123'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-1'),
      tipo: TxTipo.ACREDITACION,
      cantidad: new CantidadPuntos(75),
      createdAt: now,
      referenciaId: undefined,
    });
    jest.spyOn(txFactory, 'createFromDto').mockReturnValue(txEntity);

    // Act
    const result = await service.execute(req);

    // Assert: factory called with params
    expect(loteFactory.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'client-1',
        cantidad: new CantidadPuntos(75),
        origen,
      }),
    );
    // Assert: repo.save called with the lote entity
    expect(loteRepo.save).toHaveBeenCalledWith(loteEntity);
    // Assert: txFactory called with a DTO matching lote-1
    expect(txFactory.createFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        loteId: new LoteId('lote-1'),
        tipo: TxTipo.ACREDITACION,
        cantidad: new CantidadPuntos(75),
      }),
    );
    // Assert: txRepo.save with entity
    expect(txRepo.save).toHaveBeenCalledWith(txEntity);

    // Response structure
    expect(result.operacionId).toEqual(expect.any(Number));
    expect(result.lotesAfectados).toEqual(['lote-1']);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: 'tx-123',
        loteId: 'lote-1',
        tipo: TxTipo.ACREDITACION,
        cantidad: 75,
      }),
    ]);
  });

  it('should process a debit-only operation', async () => {
    // Arrange
    const now = new Date('2025-06-23T12:00:00Z');
    const origen = new OrigenOperacion('PLEX');
    const loteEntity = new Lote(
      new LoteId('lote-1'),
      'client-1',
      new CantidadPuntos(150),
      new CantidadPuntos(150),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    const req: CreateOperacionRequest = {
      clienteId: 'client-1',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      puntos: 100,
    };

    loteRepo.findByCliente.mockResolvedValue([loteEntity]);

    const reglaResult: ReglaEngineResult = {
      debitos: [{ loteId: 'lote-1', cantidad: 100 }],
    };
    reglaEngine.procesar.mockResolvedValue(reglaResult);

    const txEntity = Transaccion.createOrphan({
      id: new TransaccionId('tx-124'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-1'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(100),
      createdAt: now,
      referenciaId: undefined,
    });
    jest.spyOn(txFactory, 'createFromDto').mockReturnValue(txEntity);

    // Act
    const result = await service.execute(req);

    // Assert: repo.save called with the lote entity
    expect(loteRepo.update).toHaveBeenCalledWith(loteEntity);
    // Assert: txFactory called with a DTO matching lote-1
    expect(txFactory.createFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        loteId: new LoteId('lote-1'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(100),
      }),
    );
    // Assert: txRepo.save with entity
    expect(txRepo.save).toHaveBeenCalledWith(txEntity);

    // Response structure
    expect(result.operacionId).toEqual(expect.any(Number));
    expect(result.lotesAfectados).toEqual(['lote-1']);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: 'tx-124',
        loteId: 'lote-1',
        tipo: TxTipo.GASTO,
        cantidad: 100,
      }),
    ]);
  });

  it('should process a mixed purchase (points + currency)', async () => {
    // Arrange
    const now = new Date('2025-06-25T12:00:00Z');
    const origen = new OrigenOperacion('PLEX');
    const initialLote = new Lote(
      new LoteId('lote-1'),
      'client-1',
      new CantidadPuntos(200),
      new CantidadPuntos(200),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    loteRepo.findByCliente.mockResolvedValue([initialLote]);

    const req: CreateOperacionRequest = {
      clienteId: 'client-1',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      puntos: 100,
      montoMoneda: 50,
      moneda: 'ARS',
    };

    const reglaResult: ReglaEngineResult = {
      debitos: [{ loteId: 'lote-1', cantidad: 100 }],
      credito: { cantidad: 30, expiraEn: now },
    };
    (reglaEngine.procesar as jest.Mock).mockResolvedValue(reglaResult);

    // Stub credit lote
    const creditLote = new Lote(
      new LoteId('lote-2'),
      'client-1',
      new CantidadPuntos(30),
      new CantidadPuntos(30),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    jest.spyOn(loteFactory, 'crear').mockReturnValue(creditLote);

    // Stub transactions: first debit, then credit
    const txDebit = Transaccion.createOrphan({
      id: new TransaccionId('tx-debit'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-1'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(100),
      createdAt: now,
      referenciaId: undefined,
    });
    const txCredit = Transaccion.createOrphan({
      id: new TransaccionId('tx-credit'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-2'),
      tipo: TxTipo.ACREDITACION,
      cantidad: new CantidadPuntos(30),
      createdAt: now,
      referenciaId: undefined,
    });
    const txSpy = jest.spyOn(txFactory, 'createFromDto');
    txSpy.mockReturnValueOnce(txDebit).mockReturnValueOnce(txCredit);

    // Act
    const result = await service.execute(req);

    // Assert: initial lote updated
    expect(loteRepo.update).toHaveBeenCalledWith(initialLote);

    // Assert: credit lote created and saved
    expect(loteFactory.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'client-1',
        cantidad: new CantidadPuntos(30),
        origen,
      }),
    );
    expect(loteRepo.save).toHaveBeenCalledWith(creditLote);

    // Assert: transactions created
    expect(txFactory.createFromDto).toHaveBeenCalledTimes(2);
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        loteId: new LoteId('lote-1'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(100),
      }),
    );
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        loteId: new LoteId('lote-2'),
        tipo: TxTipo.ACREDITACION,
        cantidad: new CantidadPuntos(30),
      }),
    );
    expect(txRepo.save).toHaveBeenCalledWith(txDebit);
    expect(txRepo.save).toHaveBeenCalledWith(txCredit);

    // Response structure
    expect(result.lotesAfectados).toEqual(['lote-1', 'lote-2']);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: 'tx-debit',
        tipo: TxTipo.GASTO,
        cantidad: 100,
      }),
      expect.objectContaining({
        id: 'tx-credit',
        tipo: TxTipo.ACREDITACION,
        cantidad: 30,
      }),
    ]);
  });

  it('should process a points-only purchase across multiple batches', async () => {
    // Arrange
    const now = new Date('2025-06-26T10:00:00Z');
    const origen = new OrigenOperacion('PLEX');

    // Tres lotes iniciales en el saldo
    const lote1 = new Lote(
      new LoteId('lote-1'),
      'client-1',
      new CantidadPuntos(150),
      new CantidadPuntos(150),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    const lote2 = new Lote(
      new LoteId('lote-2'),
      'client-1',
      new CantidadPuntos(250),
      new CantidadPuntos(250),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    const lote3 = new Lote(
      new LoteId('lote-3'),
      'client-1',
      new CantidadPuntos(200),
      new CantidadPuntos(200),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    loteRepo.findByCliente.mockResolvedValue([lote1, lote2, lote3]);

    const req: CreateOperacionRequest = {
      clienteId: 'client-1',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      puntos: 500,
    };

    // El motor de reglas devuelve tres débitos
    const reglaResult: ReglaEngineResult = {
      debitos: [
        { loteId: 'lote-1', cantidad: 150 },
        { loteId: 'lote-2', cantidad: 250 },
        { loteId: 'lote-3', cantidad: 100 },
      ],
    };
    (reglaEngine.procesar as jest.Mock).mockResolvedValue(reglaResult);

    // Stubs de transacciones para cada débito
    const tx1 = Transaccion.createOrphan({
      id: new TransaccionId('tx-1'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-1'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(150),
      createdAt: now,
      referenciaId: undefined,
    });
    const tx2 = Transaccion.createOrphan({
      id: new TransaccionId('tx-2'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-2'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(250),
      createdAt: now,
      referenciaId: undefined,
    });
    const tx3 = Transaccion.createOrphan({
      id: new TransaccionId('tx-3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-3'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(100),
      createdAt: now,
      referenciaId: undefined,
    });
    const txSpy = jest.spyOn(txFactory, 'createFromDto');
    txSpy
      .mockReturnValueOnce(tx1)
      .mockReturnValueOnce(tx2)
      .mockReturnValueOnce(tx3);

    // Act
    const result = await service.execute(req);

    // Assert: se consumen los tres lotes
    expect(loteRepo.update).toHaveBeenCalledWith(lote1);
    expect(loteRepo.update).toHaveBeenCalledWith(lote2);
    expect(loteRepo.update).toHaveBeenCalledWith(lote3);

    // Assert: se crean tres transacciones de gasto
    expect(txFactory.createFromDto).toHaveBeenCalledTimes(3);
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        loteId: new LoteId('lote-1'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(150),
      }),
    );
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        loteId: new LoteId('lote-2'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(250),
      }),
    );
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        loteId: new LoteId('lote-3'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(100),
      }),
    );
    expect(txRepo.save).toHaveBeenCalledWith(tx1);
    expect(txRepo.save).toHaveBeenCalledWith(tx2);
    expect(txRepo.save).toHaveBeenCalledWith(tx3);

    // Response contiene los IDs de lotes gastados y transacciones
    expect(result.lotesAfectados).toEqual(['lote-1', 'lote-2', 'lote-3']);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: 'tx-1',
        loteId: 'lote-1',
        tipo: TxTipo.GASTO,
        cantidad: 150,
      }),
      expect.objectContaining({
        id: 'tx-2',
        loteId: 'lote-2',
        tipo: TxTipo.GASTO,
        cantidad: 250,
      }),
      expect.objectContaining({
        id: 'tx-3',
        loteId: 'lote-3',
        tipo: TxTipo.GASTO,
        cantidad: 100,
      }),
    ]);
  });

  it('should process a refund operation (DEVOLUCION)', async () => {
    // Arrange
    const now = new Date('2025-06-27T09:00:00Z');
    const origen = new OrigenOperacion('PLEX');
    // Lote inicial con remaining 60 de original 100
    const loteEntity = new Lote(
      new LoteId('lote-1'),
      'client-1',
      new CantidadPuntos(100),
      new CantidadPuntos(60),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    loteRepo.findByCliente.mockResolvedValue([loteEntity]);

    const req: CreateOperacionRequest = {
      clienteId: 'client-1',
      tipo: OpTipo.DEVOLUCION,
      origenTipo: origen,
      puntos: 40,
    };

    const reglaResult: ReglaEngineResult = {
      debitos: [{ loteId: 'lote-1', cantidad: 40 }],
    };
    (reglaEngine.procesar as jest.Mock).mockResolvedValue(reglaResult);

    // Stub transacción de devolución
    const txEntity = Transaccion.createOrphan({
      id: new TransaccionId('tx-refund'),
      operationId: OperacionId.create(),
      loteId: new LoteId('lote-1'),
      tipo: TxTipo.DEVOLUCION,
      cantidad: new CantidadPuntos(40),
      createdAt: now,
      referenciaId: undefined,
    });
    jest.spyOn(txFactory, 'createFromDto').mockReturnValue(txEntity);

    // Act
    const result = await service.execute(req);

    // Assert: lote actualizado y remaining ajustado a 100
    expect(loteRepo.update).toHaveBeenCalledWith(loteEntity);
    expect(loteEntity.remaining.value).toBe(100);

    // Assert: transacción de devolución creada y guardada
    expect(txFactory.createFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        loteId: new LoteId('lote-1'),
        tipo: TxTipo.DEVOLUCION,
        cantidad: new CantidadPuntos(40),
      }),
    );
    expect(txRepo.save).toHaveBeenCalledWith(txEntity);

    // Assert: respuesta correcta
    expect(result.lotesAfectados).toEqual(['lote-1']);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: 'tx-refund',
        loteId: 'lote-1',
        tipo: TxTipo.DEVOLUCION,
        cantidad: 40,
      }),
    ]);
  });
});
