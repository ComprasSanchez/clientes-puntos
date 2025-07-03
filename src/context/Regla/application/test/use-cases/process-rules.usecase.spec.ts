/* eslint-disable @typescript-eslint/unbound-method */
import { OpTipo } from '@shared/core/enums/OpTipo';
import { ExecuteRulesUseCase } from '../../use-cases/ReglaProcessRules/ProcessRules';
import { RulesOrchestrationService } from '../../services/RuleOrchestationService';
import { ExecuteRulesRequestDto } from '../../dtos/RunRuleRequest.dto';
import { ExecuteRulesResponseDto } from '../../dtos/RunRuleResponse.dto';
import { CantidadPuntos } from '../../../core/value-objects/CantidadPuntos';
import { MontoMoneda } from '../../../core/value-objects/MontoMoneda';
import { Moneda } from '../../../core/value-objects/Moneda';
import { FechaOperacion } from '../../../core/value-objects/FechaOperacion';

describe('ExecuteRulesUseCase', () => {
  let orchestration: RulesOrchestrationService;
  let useCase: ExecuteRulesUseCase;

  beforeEach(() => {
    // Stub sólo el método que nos interesa
    orchestration = {
      execute: jest.fn(),
    } as unknown as RulesOrchestrationService;
    useCase = new ExecuteRulesUseCase(orchestration);
  });

  it('mapea sólo campos obligatorios y devuelve sólo debitAmount', async () => {
    const dto: ExecuteRulesRequestDto = {
      clienteId: 'cliente-1',
      tipo: OpTipo.COMPRA,
      fecha: new Date('2025-06-20T12:00:00.000Z'),
      saldoActual: 100,
    };
    // El orquestador devuelve sólo debitAmount
    (orchestration.execute as jest.Mock).mockResolvedValue({ debitAmount: 42 });

    const result = await useCase.execute(dto);

    // El stub se llamó exactamente con el contexto mapeado
    expect(orchestration.execute).toHaveBeenCalledTimes(1);
    expect(orchestration.execute).toHaveBeenCalledWith({
      clienteId: dto.clienteId,
      tipo: dto.tipo as OpTipo,
      fecha: new FechaOperacion(dto.fecha),
      puntosSolicitados: undefined,
      monto: undefined,
      moneda: undefined,
      saldoActual: new CantidadPuntos(dto.saldoActual),
    });

    // La respuesta sólo incluye debitAmount
    expect(result).toEqual({ debitAmount: 42 });
  });

  it('mapea todos los campos opcionales y formatea "credito"', async () => {
    const dto: ExecuteRulesRequestDto = {
      clienteId: 'cliente-2',
      tipo: OpTipo.DEVOLUCION,
      fecha: new Date('2025-06-21T08:00:00.000Z'),
      puntosSolicitados: 10,
      monto: 99.9,
      moneda: 'USD',
      saldoActual: 50,
    };
    const expDate = new Date('2025-07-21T08:00:00.000Z');
    const engineResult = {
      debitAmount: 15,
      credito: { cantidad: 5, expiraEn: expDate },
    };
    (orchestration.execute as jest.Mock).mockResolvedValue(engineResult);

    const result = await useCase.execute(dto);

    // Verificamos mapeo de entrada al orquestador
    expect(orchestration.execute).toHaveBeenCalledTimes(1);
    expect(orchestration.execute).toHaveBeenCalledWith({
      clienteId: dto.clienteId,
      tipo: dto.tipo as OpTipo,
      fecha: new FechaOperacion(dto.fecha),
      puntosSolicitados: new CantidadPuntos(dto.puntosSolicitados!),
      monto: new MontoMoneda(dto.monto!),
      moneda: Moneda.create(dto.moneda!),
      saldoActual: new CantidadPuntos(dto.saldoActual),
    });

    // Verificamos mapeo de salida
    expect(result).toEqual<ExecuteRulesResponseDto>({
      debitAmount: engineResult.debitAmount,
      credito: {
        cantidad: engineResult.credito.cantidad,
        expiraEn: expDate,
      },
      reglasAplicadas: {
        'regla-1': [
          {
            id: '19b7f2c5-1f4b-462e-b8b0-b8d01beeb7d3',
            nombre: 'Regla de bonificación',
          },
        ],
      },
    });
  });
});
