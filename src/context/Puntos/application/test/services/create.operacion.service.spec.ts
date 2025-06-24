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
});
