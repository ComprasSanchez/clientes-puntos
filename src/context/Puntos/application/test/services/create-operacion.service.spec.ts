import { CreateOperacionService } from '../../services/CreateOperacionService';
import { LoteRepository } from '@puntos/core/repository/LoteRepository';
import { SaldoRepository } from '@puntos/core/repository/SaldoRepository';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { CompraHandler } from '../../handlers/CompraHandler';
import { AjusteHandler } from '../../handlers/AjusteHandler';
import { DevolucionHandler } from '../../handlers/DevolucionHandler';
import { AnulacionHandler } from '../../handlers/AnulacionHandler';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { HandlerResult } from '../../dtos/HandlerResult';
import { Operacion } from '@puntos/core/entities/Operacion';
import { FechaOperacion } from '@puntos/core/value-objects/FechaOperacion';
import { MontoMoneda } from '@puntos/core/value-objects/MontoMoneda';
import { Moneda } from '@puntos/core/value-objects/Moneda';
import { Lote } from '@puntos/core/entities/Lote';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { BatchEstado } from '@puntos/core/enums/BatchEstado';
import { FechaExpiracion } from '@puntos/core/value-objects/FechaExpiracion';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';
import { RefundError } from '@puntos/core/exceptions/Operacion/RefundError';
import { OperacionNotFoundError } from '@puntos/core/exceptions/Operacion/OperacionNotFoundError';

function buildOperacion(id = 1001, tipo: OpTipo = OpTipo.COMPRA): Operacion {
  return new Operacion(
    OperacionId.instance(id),
    'cliente-1',
    tipo,
    new FechaOperacion(new Date('2026-03-03T00:00:00.000Z')),
    new OrigenOperacion('POS'),
    undefined,
    tipo === OpTipo.ANULACION ? undefined : new MontoMoneda(1000),
    tipo === OpTipo.ANULACION ? undefined : Moneda.create('ARS'),
    new ReferenciaMovimiento('ref-1'),
  );
}

function buildLote(id: string): Lote {
  return new Lote(
    new LoteId(id),
    'cliente-1',
    new CantidadPuntos(100),
    new CantidadPuntos(80),
    BatchEstado.DISPONIBLE,
    new Date('2026-03-03T00:00:00.000Z'),
    new FechaExpiracion(new Date('2026-12-31T00:00:00.000Z')),
    new OrigenOperacion('POS'),
    new ReferenciaMovimiento('ref-1'),
  );
}

function buildTransaccion(
  id: string,
  loteId: string,
  tipo: TxTipo,
  cantidad: number,
  operacionId = 1001,
): Transaccion {
  return Transaccion.createOrphan({
    id: new TransaccionId(id),
    operationId: OperacionId.instance(operacionId),
    loteId: new LoteId(loteId),
    tipo,
    cantidad: new CantidadPuntos(cantidad),
    createdAt: new Date('2026-03-03T00:00:00.000Z'),
    reglasAplicadas: {
      regla_1: [{ id: 'r1', nombre: 'Regla 1' }],
    },
    referenciaId: new ReferenciaMovimiento('ref-1'),
  });
}

describe('CreateOperacionService', () => {
  let loteRepo: jest.Mocked<LoteRepository>;
  let saldoRepo: jest.Mocked<SaldoRepository>;
  let txRepo: jest.Mocked<TransaccionRepository>;
  let operacionRepo: jest.Mocked<OperacionRepository>;
  let compraHandler: jest.Mocked<CompraHandler>;
  let ajusteHandler: jest.Mocked<AjusteHandler>;
  let devolucionHandler: jest.Mocked<DevolucionHandler>;
  let anulacionHandler: jest.Mocked<AnulacionHandler>;
  let service: CreateOperacionService;

  beforeEach(() => {
    loteRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCliente: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    saldoRepo = {
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      updateSaldo: jest.fn(),
      delete: jest.fn(),
      saveHistorial: jest.fn(),
      findHistorialByClienteId: jest.fn(),
    };
    txRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByLote: jest.fn(),
      findByCliente: jest.fn(),
      findByOperationId: jest.fn(),
      findByOperacionIds: jest.fn(),
      findByReferencia: jest.fn(),
      findBetween: jest.fn(),
      findByFecha: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    operacionRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCliente: jest.fn(),
      findByReferencia: jest.fn(),
      findBetween: jest.fn(),
      findByFecha: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    compraHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CompraHandler>;
    ajusteHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<AjusteHandler>;
    devolucionHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<DevolucionHandler>;
    anulacionHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<AnulacionHandler>;

    service = new CreateOperacionService(
      loteRepo,
      saldoRepo,
      txRepo,
      operacionRepo,
      compraHandler,
      ajusteHandler,
      devolucionHandler,
      anulacionHandler,
    );

    saldoRepo.findByClienteId.mockResolvedValue(new CantidadPuntos(100));
    loteRepo.findByCliente.mockResolvedValue([]);
  });

  it('procesa compra y calcula puntos de debito/credito desde transacciones', async () => {
    const loteActualizado = buildLote('42d27718-7c8f-4f15-a8df-d4bfe45bcd54');
    const nuevoLote = buildLote('20fe9a2a-1885-42dd-ae8e-6e3ad99c3cbc');
    const txs = [
      buildTransaccion(
        'f72cbec0-af08-4d66-b8e2-b28ccf4143fa',
        loteActualizado.id.value,
        TxTipo.GASTO,
        40,
      ),
      buildTransaccion(
        '3d7d30f2-a0b2-417e-b307-f87dbf7ce5ec',
        nuevoLote.id.value,
        TxTipo.ACREDITACION,
        25,
      ),
    ];
    const resultHandler: HandlerResult = {
      operacion: buildOperacion(1001, OpTipo.COMPRA),
      lotesActualizados: [loteActualizado],
      nuevoLote,
      transacciones: txs,
      saldoAnterior: 100,
      saldoNuevo: 85,
    };
    compraHandler.handle.mockResolvedValue(resultHandler);

    const res = await service.execute({
      clienteId: 'cliente-1',
      tipo: OpTipo.COMPRA,
      origenTipo: new OrigenOperacion('POS'),
      montoMoneda: 1000,
      moneda: 'ARS',
      referencia: new ReferenciaMovimiento('ref-1'),
    });

    expect(compraHandler.handle).toHaveBeenCalledTimes(1);
    expect(loteRepo.update).toHaveBeenCalledWith(loteActualizado, undefined);
    expect(loteRepo.save).toHaveBeenCalledWith(nuevoLote, undefined);
    expect(txRepo.save).toHaveBeenCalledTimes(2);
    expect(operacionRepo.save).toHaveBeenCalledWith(
      resultHandler.operacion,
      undefined,
    );
    expect(res.puntosDebito).toBe(40);
    expect(res.puntosCredito).toBe(25);
    expect(res.lotesAfectados).toHaveLength(2);
  });

  it('en devolucion por referencia toma transacciones originales y propaga operacionId', async () => {
    const txOriginal = buildTransaccion(
      'af1307c2-c82d-445c-95ae-f425b5a60036',
      '4dc718eb-c9d3-4659-b34b-7f2d2f79f48f',
      TxTipo.GASTO,
      10,
      2001,
    );
    txRepo.findByReferencia.mockResolvedValue([txOriginal]);
    const resultHandler: HandlerResult = {
      operacion: buildOperacion(3001, OpTipo.DEVOLUCION),
      lotesActualizados: [],
      nuevoLote: undefined,
      transacciones: [],
      saldoAnterior: 100,
      saldoNuevo: 90,
    };
    devolucionHandler.handle.mockResolvedValue(resultHandler);

    await service.execute({
      clienteId: 'cliente-1',
      tipo: OpTipo.DEVOLUCION,
      origenTipo: new OrigenOperacion('POS'),
      referencia: new ReferenciaMovimiento('ref-1'),
      montoMoneda: 100,
      moneda: 'ARS',
    });

    const devolucionReq = devolucionHandler.handle.mock.calls[0][0];
    expect(devolucionReq.operacionId?.value).toBe(2001);
    expect(devolucionHandler.handle.mock.calls[0][2]).toEqual([txOriginal]);
  });

  it('lanza RefundError en anulacion cuando no hay transacciones originales', async () => {
    txRepo.findByOperationId.mockResolvedValue([]);

    await expect(
      service.execute({
        clienteId: 'cliente-1',
        tipo: OpTipo.ANULACION,
        origenTipo: new OrigenOperacion('POS'),
        operacionId: OperacionId.instance(9999),
        referencia: new ReferenciaMovimiento('ref-1'),
      }),
    ).rejects.toThrow(RefundError);

    expect(anulacionHandler.handle).not.toHaveBeenCalled();
  });

  it('lanza OperacionNotFoundError en anulacion cuando no encuentra operacion original', async () => {
    const txOriginal = buildTransaccion(
      'b03edbcd-10ce-4687-9a4e-28f930ce7c82',
      '51d7e0d5-69dc-4d4e-8904-bd03e66cf500',
      TxTipo.GASTO,
      10,
      777,
    );
    txRepo.findByOperationId.mockResolvedValue([txOriginal]);
    operacionRepo.findById.mockResolvedValue(null);

    await expect(
      service.execute({
        clienteId: 'cliente-1',
        tipo: OpTipo.ANULACION,
        origenTipo: new OrigenOperacion('POS'),
        operacionId: OperacionId.instance(777),
        referencia: new ReferenciaMovimiento('ref-1'),
      }),
    ).rejects.toThrow(OperacionNotFoundError);
  });

  it('en ajuste exige tipoAjuste', async () => {
    await expect(
      service.execute({
        clienteId: 'cliente-1',
        tipo: OpTipo.AJUSTE,
        origenTipo: new OrigenOperacion('POS'),
        puntos: 10,
      }),
    ).rejects.toThrow('Falta tipo de ajuste');
  });

  it('en ajuste delega al handler correspondiente cuando recibe tipoAjuste', async () => {
    const resultHandler: HandlerResult = {
      operacion: buildOperacion(6001, OpTipo.AJUSTE),
      lotesActualizados: [],
      nuevoLote: undefined,
      transacciones: [
        buildTransaccion(
          '0832dd3a-ff46-429d-9247-f10968cbf7bf',
          '9eb1cb62-df3f-4531-8fd3-8f577ad5e727',
          TxTipo.ACREDITACION,
          15,
          6001,
        ),
      ],
      saldoAnterior: 100,
      saldoNuevo: 115,
    };
    ajusteHandler.handle.mockResolvedValue(resultHandler);

    const res = await service.execute(
      {
        clienteId: 'cliente-1',
        tipo: OpTipo.AJUSTE,
        origenTipo: new OrigenOperacion('POS'),
        puntos: 15,
        referencia: new ReferenciaMovimiento('ref-ajuste'),
      },
      undefined,
      TxTipo.ACREDITACION,
    );

    expect(ajusteHandler.handle).toHaveBeenCalledTimes(1);
    expect(res.puntosCredito).toBe(15);
    expect(res.puntosDebito).toBe(0);
  });

  it('en devolucion con operacionId usa findByOperationId', async () => {
    const txOriginal = buildTransaccion(
      '40ca6b6f-2b95-4f68-a615-2a17257f8cb2',
      '286853f1-8463-45bc-bf47-76473e5f3618',
      TxTipo.GASTO,
      20,
      321,
    );
    txRepo.findByOperationId.mockResolvedValue([txOriginal]);
    devolucionHandler.handle.mockResolvedValue({
      operacion: buildOperacion(7001, OpTipo.DEVOLUCION),
      lotesActualizados: [],
      nuevoLote: undefined,
      transacciones: [],
      saldoAnterior: 100,
      saldoNuevo: 80,
    });

    await service.execute({
      clienteId: 'cliente-1',
      tipo: OpTipo.DEVOLUCION,
      origenTipo: new OrigenOperacion('POS'),
      operacionId: OperacionId.instance(321),
      referencia: new ReferenciaMovimiento('ref-dev-1'),
      puntos: 20,
    });

    expect(txRepo.findByOperationId).toHaveBeenCalledWith(321);
    expect(devolucionHandler.handle.mock.calls[0][2]).toEqual([txOriginal]);
  });

  it('en anulacion por referencia delega al handler con request armado desde operacion original', async () => {
    const txOriginal = buildTransaccion(
      '60f2dcef-a041-4f42-9e43-f6df8b19f0e3',
      '7fcd3bf6-1de4-429f-8fe2-f4352ee5e6b7',
      TxTipo.GASTO,
      10,
      4321,
    );
    txRepo.findByReferencia.mockResolvedValue([txOriginal]);
    operacionRepo.findById.mockResolvedValue(
      buildOperacion(4321, OpTipo.COMPRA),
    );
    anulacionHandler.handle.mockResolvedValue({
      operacion: buildOperacion(8001, OpTipo.ANULACION),
      lotesActualizados: [],
      nuevoLote: undefined,
      transacciones: [
        buildTransaccion(
          '7f9200d2-1205-44a7-b283-4ca1648f34b9',
          '7fcd3bf6-1de4-429f-8fe2-f4352ee5e6b7',
          TxTipo.ACREDITACION,
          10,
          8001,
        ),
      ],
      saldoAnterior: 90,
      saldoNuevo: 100,
    });

    await service.execute({
      clienteId: 'cliente-1',
      tipo: OpTipo.ANULACION,
      origenTipo: new OrigenOperacion('POS'),
      referencia: new ReferenciaMovimiento('ref-1'),
    });

    expect(txRepo.findByReferencia).toHaveBeenCalledWith('ref-1');
    expect(operacionRepo.findById).toHaveBeenCalledWith(
      OperacionId.instance(4321),
    );
    expect(anulacionHandler.handle).toHaveBeenCalledTimes(1);
    const anulacionReq = anulacionHandler.handle.mock.calls[0][0];
    expect(anulacionReq.tipo).toBe(OpTipo.ANULACION);
    expect(anulacionReq.operacionId?.value).toBe(4321);
  });

  it('lanza OperacionNotFoundError si la referencia trae tx sin operationId', async () => {
    txRepo.findByReferencia.mockResolvedValue([
      {
        operationId: undefined,
      } as unknown as Transaccion,
    ]);

    await expect(
      service.execute({
        clienteId: 'cliente-1',
        tipo: OpTipo.ANULACION,
        origenTipo: new OrigenOperacion('POS'),
        referencia: new ReferenciaMovimiento('ref-1'),
      }),
    ).rejects.toThrow('operacionId no definido');
  });

  it('lanza error para tipo de operacion no soportado', async () => {
    await expect(
      service.execute({
        clienteId: 'cliente-1',
        tipo: 'desconocido' as OpTipo,
        origenTipo: new OrigenOperacion('POS'),
        puntos: 1,
      }),
    ).rejects.toThrow('Tipo de operación no soportado');
  });
});
