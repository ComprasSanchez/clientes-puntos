/* eslint-disable @typescript-eslint/unbound-method */
import { OpTipo } from '@shared/core/enums/OpTipo';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import {
  IReglaEngine,
  ReglaEngineResult,
} from '@puntos/core/interfaces/IReglaEngine';
import { Lote } from '@puntos/core/entities/Lote';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { CreateOperacionService } from '../../services/CreateOperacionService';
import { CreateOperacionRequest } from '../../dtos/CreateOperacionRequest';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { FakeUUIDGen } from '@shared/core/uuid/test/stubs/FakeUUIDGenerator';
import { BatchEstado } from '@puntos/core/enums/BatchEstado';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';
import { SaldoHandler } from '@puntos/application/services/SaldoHandler';
import { LoteFactory } from '@puntos/core/factories/LoteFactory';
import { TransaccionFactory } from '@puntos/core/factories/TransaccionFactory';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';

describe('CreateOperacionService', () => {
  let loteRepo: jest.Mocked<LoteRepository>;
  let txRepo: jest.Mocked<TransaccionRepository>;
  let opRepo: jest.Mocked<OperacionRepository>;
  let saldoRepo: jest.Mocked<SaldoRepository>;
  let reglaEngine: jest.Mocked<IReglaEngine>;
  let loteFactory: LoteFactory;
  let txFactory: TransaccionFactory;
  let sHandler: SaldoHandler;
  let service: CreateOperacionService;
  let idGen: FakeUUIDGen;

  beforeEach(() => {
    idGen = new FakeUUIDGen();

    saldoRepo = {
      findByClienteId: jest.fn(),
      updateSaldo: jest.fn(),
      delete: jest.fn(),
      saveHistorial: jest.fn(),
      findHistorialByClienteId: jest.fn(),
    };

    loteFactory = new LoteFactory(idGen);
    txFactory = new TransaccionFactory(idGen);
    sHandler = new SaldoHandler(loteFactory, saldoRepo);

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
      findByOperationId: jest.fn(),
      findByReferencia: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    opRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCliente: jest.fn(),
      findByReferencia: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    reglaEngine = { procesar: jest.fn() };

    service = new CreateOperacionService(
      loteRepo,
      saldoRepo,
      txRepo,
      opRepo,
      reglaEngine,
      txFactory,
      sHandler,
    );
  });

  it('should process a credit-only operation', async () => {
    // Arrange
    const now = new Date('2025-06-24T12:00:00Z');
    const origen = new OrigenOperacion('PLEX');
    const req: CreateOperacionRequest = {
      clienteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      montoMoneda: 150,
      moneda: 'ARS',
    };

    loteRepo.findByCliente.mockResolvedValue([]);

    const reglaResult: ReglaEngineResult = {
      debitAmount: 0,
      credito: { cantidad: 75, expiraEn: now },
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    };
    reglaEngine.procesar.mockResolvedValue(reglaResult);

    const loteEntity = new Lote(
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
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
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.ACREDITACION,
      cantidad: new CantidadPuntos(75),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    jest.spyOn(txFactory, 'createFromDto').mockReturnValue(txEntity);

    // Act
    const result = await service.execute(req);

    // Assert: factory called with params
    expect(loteFactory.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        cantidad: new CantidadPuntos(75),
        origen,
      }),
    );
    // Assert: repo.save called with the lote entity
    expect(loteRepo.save).toHaveBeenCalledWith(loteEntity, undefined);
    // Assert: txFactory called with a DTO matching lote-1
    expect(txFactory.createFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.ACREDITACION,
        cantidad: new CantidadPuntos(75),
      }),
    );
    // Assert: txRepo.save with entity
    expect(txRepo.save).toHaveBeenCalledWith(txEntity);

    // Response structure
    expect(result.operacionId).toEqual(expect.any(Number));
    expect(result.lotesAfectados).toEqual([loteEntity]);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        loteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
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
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      new CantidadPuntos(150),
      new CantidadPuntos(150),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    const req: CreateOperacionRequest = {
      clienteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      puntos: 100,
    };

    loteRepo.findByCliente.mockResolvedValue([loteEntity]);

    const reglaResult: ReglaEngineResult = {
      debitAmount: 100,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    };
    reglaEngine.procesar.mockResolvedValue(reglaResult);

    const txEntity = Transaccion.createOrphan({
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(100),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    jest.spyOn(txFactory, 'createFromDto').mockReturnValue(txEntity);

    // Act
    const result = await service.execute(req);

    // Assert: repo.save called with the lote entity
    expect(loteRepo.update).toHaveBeenCalledWith(loteEntity, undefined);
    // Assert: txFactory called with a DTO matching lote-1
    expect(txFactory.createFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(100),
      }),
    );
    // Assert: txRepo.save with entity
    expect(txRepo.save).toHaveBeenCalledWith(txEntity);

    // Response structure
    expect(result.operacionId).toEqual(expect.any(Number));
    expect(result.lotesAfectados).toEqual([
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
    ]);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        loteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
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
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
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
      clienteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      puntos: 100,
      montoMoneda: 50,
      moneda: 'ARS',
    };

    const reglaResult: ReglaEngineResult = {
      debitAmount: 100,
      credito: { cantidad: 30, expiraEn: now },
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    };
    (reglaEngine.procesar as jest.Mock).mockResolvedValue(reglaResult);

    // Stub credit lote
    const creditLote = new Lote(
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
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
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(100),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    const txCredit = Transaccion.createOrphan({
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.ACREDITACION,
      cantidad: new CantidadPuntos(30),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    const txSpy = jest.spyOn(txFactory, 'createFromDto');
    txSpy.mockReturnValueOnce(txDebit).mockReturnValueOnce(txCredit);

    // Act
    const result = await service.execute(req);

    // Assert: initial lote updated
    expect(loteRepo.update).toHaveBeenCalledWith(initialLote, undefined);

    // Assert: credit lote created and saved
    expect(loteFactory.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        cantidad: new CantidadPuntos(30),
        origen,
      }),
    );
    expect(loteRepo.save).toHaveBeenCalledWith(creditLote, undefined);

    // Assert: transactions created
    expect(txFactory.createFromDto).toHaveBeenCalledTimes(2);
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(100),
      }),
    );
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.ACREDITACION,
        cantidad: new CantidadPuntos(30),
      }),
    );
    expect(txRepo.save).toHaveBeenCalledWith(txDebit);
    expect(txRepo.save).toHaveBeenCalledWith(txCredit);

    // Response structure
    expect(result.lotesAfectados).toEqual([initialLote.id, creditLote]);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        tipo: TxTipo.GASTO,
        cantidad: 100,
      }),
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
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
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      new CantidadPuntos(150),
      new CantidadPuntos(150),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    const lote2 = new Lote(
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      new CantidadPuntos(250),
      new CantidadPuntos(250),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    const lote3 = new Lote(
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
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
      clienteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      tipo: OpTipo.COMPRA,
      origenTipo: origen,
      puntos: 500,
    };

    // El motor de reglas devuelve tres débitos
    const reglaResult: ReglaEngineResult = {
      debitAmount: 500,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    };
    (reglaEngine.procesar as jest.Mock).mockResolvedValue(reglaResult);

    // Stubs de transacciones para cada débito
    const tx1 = Transaccion.createOrphan({
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(150),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    const tx2 = Transaccion.createOrphan({
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(250),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    const tx3 = Transaccion.createOrphan({
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(100),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    const txSpy = jest.spyOn(txFactory, 'createFromDto');
    txSpy
      .mockReturnValueOnce(tx1)
      .mockReturnValueOnce(tx2)
      .mockReturnValueOnce(tx3);

    // Act
    const result = await service.execute(req);

    // Assert: se consumen los tres lotes
    expect(loteRepo.update).toHaveBeenCalledWith(lote1, undefined);
    expect(loteRepo.update).toHaveBeenCalledWith(lote2, undefined);
    expect(loteRepo.update).toHaveBeenCalledWith(lote3, undefined);

    // Assert: se crean tres transacciones de gasto
    expect(txFactory.createFromDto).toHaveBeenCalledTimes(3);
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(150),
      }),
    );
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(250),
      }),
    );
    expect(txFactory.createFromDto).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.GASTO,
        cantidad: new CantidadPuntos(100),
      }),
    );
    expect(txRepo.save).toHaveBeenCalledWith(tx1);
    expect(txRepo.save).toHaveBeenCalledWith(tx2);
    expect(txRepo.save).toHaveBeenCalledWith(tx3);

    // Response contiene los IDs de lotes gastados y transacciones
    expect(result.lotesAfectados).toEqual([
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
    ]);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        loteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        tipo: TxTipo.GASTO,
        cantidad: 150,
      }),
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        loteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        tipo: TxTipo.GASTO,
        cantidad: 250,
      }),
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        loteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        tipo: TxTipo.GASTO,
        cantidad: 100,
      }),
    ]);
  });

  it('should process a refund operation (DEVOLUCION)', async () => {
    // Arrange
    const now = new Date('2025-06-27T09:00:00Z');
    const origen = new OrigenOperacion('PLEX');

    // 1️⃣ Lote inicial con remaining 60 de original 100
    const loteEntity = new Lote(
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      new CantidadPuntos(100),
      new CantidadPuntos(60),
      BatchEstado.DISPONIBLE,
      now,
      null,
      origen,
      undefined,
    );
    loteRepo.findByCliente.mockResolvedValue([loteEntity]);

    // 2️⃣ Simulo la operación de COMPRA previa
    //    — El ID de esa operación…
    const purchaseOpId = OperacionId.create();
    //    — Y la transacción de GASTO que dejó el lote en remaining 60
    const purchaseTx = Transaccion.createOrphan({
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: purchaseOpId,
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.GASTO,
      cantidad: new CantidadPuntos(40),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    //    — El repo de transacciones debe devolvérmela
    txRepo.findByOperationId.mockResolvedValue([purchaseTx]);

    // 3️⃣ Petición de devolución, usando el mismo operationId
    const req: CreateOperacionRequest = {
      clienteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
      tipo: OpTipo.DEVOLUCION,
      origenTipo: origen,
      puntos: 40,
      operacionId: purchaseOpId,
      // resto de campos (monto, referencia…) según tu dto
    };

    // 4️⃣ El engine de reglas nos dice que hay que debitar 40
    const reglaResult = {
      debitAmount: 40,
      credito: undefined,
      reglasAplicadas: {},
    };
    (reglaEngine.procesar as jest.Mock).mockResolvedValue(reglaResult);

    // 5️⃣ Stub para la creación de la transacción de devolución
    const txEntity = Transaccion.createOrphan({
      id: new TransaccionId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      operationId: OperacionId.create(),
      loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
      tipo: TxTipo.DEVOLUCION,
      cantidad: new CantidadPuntos(40),
      createdAt: now,
      referenciaId: undefined,
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
    jest.spyOn(txFactory, 'createFromDto').mockReturnValue(txEntity);

    // Act
    const result = await service.execute(req);

    // Assert: el lote vuelve a 100
    expect(loteRepo.update).toHaveBeenCalledWith(loteEntity);
    expect(loteEntity.remaining.value).toBe(100);

    // Assert: se crea y guarda la tx de devolución
    expect(txFactory.createFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        loteId: new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
        tipo: TxTipo.DEVOLUCION,
        cantidad: new CantidadPuntos(40),
      }),
    );
    expect(txRepo.save).toHaveBeenCalledWith(txEntity);

    // Assert: respuesta correcta
    expect(result.lotesAfectados).toEqual([
      new LoteId('19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3'),
    ]);
    expect(result.transacciones).toEqual([
      expect.objectContaining({
        id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        loteId: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
        tipo: TxTipo.DEVOLUCION,
        cantidad: 40,
      }),
    ]);
  });
});
