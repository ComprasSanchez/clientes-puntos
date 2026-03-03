import { FindOperacionDetalleByIdUseCase } from '../../use-cases/OperacionDetalleView/OperacionDetalleView';
import { OperacionRepository } from '@puntos/core/repository/OperacionRepository';
import { OperacionValorService } from '../../services/OperacionValorService';
import { ClienteQueryPort } from '@puntos/core/interfaces/ClienteQuery';
import { Operacion } from '@puntos/core/entities/Operacion';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';

describe('FindOperacionDetalleByIdUseCase', () => {
  let operacionRepo: jest.Mocked<OperacionRepository>;
  let valorService: jest.Mocked<OperacionValorService>;
  let clienteQuery: jest.Mocked<ClienteQueryPort>;
  let useCase: FindOperacionDetalleByIdUseCase;

  beforeEach(() => {
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
    valorService = {
      calcularParaOperaciones: jest.fn(),
      obtenerDetalleOperacion: jest.fn(),
    } as unknown as jest.Mocked<OperacionValorService>;
    clienteQuery = {
      findById: jest.fn(),
    };

    useCase = new FindOperacionDetalleByIdUseCase(
      operacionRepo,
      valorService,
      clienteQuery,
    );
  });

  it('retorna null cuando la operacion no existe', async () => {
    operacionRepo.findById.mockResolvedValue(null);

    const result = await useCase.run(OperacionId.instance(1001));

    expect(result).toBeNull();
    expect(valorService.obtenerDetalleOperacion).not.toHaveBeenCalled();
    expect(clienteQuery.findById).not.toHaveBeenCalled();
  });

  it('retorna vista completa con valor/transacciones/cliente', async () => {
    const operacion = {
      id: OperacionId.instance(1001),
      clienteId: 'cliente-1',
    } as Operacion;

    operacionRepo.findById.mockResolvedValue(operacion);
    valorService.obtenerDetalleOperacion.mockResolvedValue({
      operacion,
      valor: {
        puntosCredito: 30,
        puntosDebito: 10,
        puntosDelta: 20,
        reglasAplicadas: { r1: [{ id: 'r1', nombre: 'Regla 1' }] },
      },
      transacciones: [{ id: 'tx-1' } as never],
    });
    clienteQuery.findById.mockResolvedValue({
      id: 'cliente-1',
      nombre: 'Juan',
      apellido: 'Perez',
    });

    const result = await useCase.run(OperacionId.instance(1001));

    expect(result).not.toBeNull();
    expect(valorService.obtenerDetalleOperacion).toHaveBeenCalledWith(
      operacion,
    );
    expect(clienteQuery.findById).toHaveBeenCalledWith('cliente-1');
    expect(result?.valor.puntosDelta).toBe(20);
    expect(result?.cliente?.id).toBe('cliente-1');
  });
});
