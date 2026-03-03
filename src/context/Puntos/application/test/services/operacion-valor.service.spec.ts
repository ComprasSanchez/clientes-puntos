import { OperacionValorService } from '../../services/OperacionValorService';
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { Operacion } from '@puntos/core/entities/Operacion';

function buildTx(
  id: string,
  opId: number,
  tipo: TxTipo,
  cantidad: number,
  reglasKey: string,
): Transaccion {
  return Transaccion.createOrphan({
    id: new TransaccionId(id),
    operationId: OperacionId.instance(opId),
    loteId: new LoteId('42d27718-7c8f-4f15-a8df-d4bfe45bcd54'),
    tipo,
    cantidad: new CantidadPuntos(cantidad),
    createdAt: new Date('2026-03-03T00:00:00.000Z'),
    referenciaId: new ReferenciaMovimiento('ref-1'),
    reglasAplicadas: {
      [reglasKey]: [{ id: reglasKey, nombre: `Regla ${reglasKey}` }],
    },
  });
}

describe('OperacionValorService', () => {
  let repo: jest.Mocked<TransaccionRepository>;
  let service: OperacionValorService;

  beforeEach(() => {
    repo = {
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

    service = new OperacionValorService(repo);
  });

  it('calcula resumen para multiples operaciones en batch', async () => {
    const operaciones = [
      { id: OperacionId.instance(1001) } as Operacion,
      { id: OperacionId.instance(1002) } as Operacion,
    ];
    repo.findByOperacionIds.mockResolvedValue([
      buildTx(
        '3f7c2e8e-7f7f-4e0d-947e-4f6f578f9e18',
        1001,
        TxTipo.ACREDITACION,
        30,
        'r1',
      ),
      buildTx(
        '3a4f62af-f7df-434e-86ef-5800f589e87a',
        1001,
        TxTipo.GASTO,
        12,
        'r2',
      ),
      buildTx(
        'dd1d4f2d-620a-4c0e-9206-9e2f453145f2',
        1002,
        TxTipo.GASTO,
        5,
        'r3',
      ),
    ]);

    const result = await service.calcularParaOperaciones(operaciones);

    expect(repo.findByOperacionIds).toHaveBeenCalledWith([1001, 1002]);
    expect(result.get(1001)).toEqual({
      puntosCredito: 30,
      puntosDebito: 12,
      puntosDelta: 18,
      reglasAplicadas: {
        r1: [{ id: 'r1', nombre: 'Regla r1' }],
        r2: [{ id: 'r2', nombre: 'Regla r2' }],
      },
    });
    expect(result.get(1002)?.puntosCredito).toBe(0);
    expect(result.get(1002)?.puntosDebito).toBe(5);
    expect(result.get(1002)?.puntosDelta).toBe(-5);
  });

  it('devuelve map vacio cuando no hay operaciones', async () => {
    const result = await service.calcularParaOperaciones([]);

    expect(result.size).toBe(0);
    expect(repo.findByOperacionIds).not.toHaveBeenCalled();
  });

  it('obtiene detalle para una operacion y agrega reglas', async () => {
    const operacion = { id: OperacionId.instance(5001) } as Operacion;
    repo.findByOperationId.mockResolvedValue([
      buildTx(
        '90f6fd6a-e111-4876-b448-395d6212857c',
        5001,
        TxTipo.ACREDITACION,
        20,
        'r1',
      ),
      buildTx(
        '12014f83-9196-4d78-baf1-f8cd00fd5dd6',
        5001,
        TxTipo.GASTO,
        4,
        'r1',
      ),
    ]);

    const result = await service.obtenerDetalleOperacion(operacion);

    expect(repo.findByOperationId).toHaveBeenCalledWith(5001);
    expect(result.valor.puntosCredito).toBe(20);
    expect(result.valor.puntosDebito).toBe(4);
    expect(result.valor.puntosDelta).toBe(16);
    expect(result.valor.reglasAplicadas.r1).toHaveLength(2);
    expect(result.transacciones).toHaveLength(2);
  });
});
