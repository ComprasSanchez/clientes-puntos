/* eslint-disable @typescript-eslint/unbound-method */
import { ReglaRepository } from '@regla/core/repository/ReglaRepository';
import { RulesOrchestrationService } from '../../services/RuleOrchestationService';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '@regla/core/interfaces/IReglaEngine';
import { ReglaCriteria } from '@regla/core/entities/Criteria';
import { RuleProcessor } from '@regla/core/services/RuleProcessor';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { FechaOperacion } from '@regla/core/value-objects/FechaOperacion';
import { CantidadPuntos } from '@regla/core/value-objects/CantidadPuntos';

describe('RulesOrchestrationService', () => {
  let repo: ReglaRepository;
  let service: RulesOrchestrationService;
  const fakeContext: ReglaEngineRequest = {
    clienteId: 'c-123',
    tipo: 'COMPRA' as OpTipo,
    fecha: new FechaOperacion(new Date()),
    puntosSolicitados: undefined,
    monto: undefined,
    moneda: undefined,
    saldoActual: new CantidadPuntos(0),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe construir criterios, llamar al repo y procesar las reglas obtenidas', async () => {
    // 1) Stub de fromContext
    const fakeCriteria = {} as ReglaCriteria;
    jest.spyOn(ReglaCriteria, 'fromContext').mockReturnValue(fakeCriteria);

    // 2) Stub del repo
    const fakeRules = [
      {
        /* dummy regla */
      },
    ] as any[];
    repo = {
      findByCriteria: jest.fn().mockResolvedValue(fakeRules),
    } as unknown as ReglaRepository;

    // 3) Spy sobre process()
    const fakeResult: ReglaEngineResult = {
      debitAmount: 100,
      credito: { cantidad: 20, expiraEn: new Date('2025-12-31T00:00:00Z') },
    };
    const processSpy = jest
      .spyOn(RuleProcessor.prototype, 'process')
      .mockReturnValue(fakeResult);

    service = new RulesOrchestrationService(repo);

    const result = await service.execute(fakeContext);

    // Verificaciones
    expect(ReglaCriteria.fromContext).toHaveBeenCalledWith(fakeContext);
    expect(repo.findByCriteria).toHaveBeenCalledWith(fakeCriteria);
    expect(processSpy).toHaveBeenCalledWith(fakeRules, fakeContext);
    expect(result).toBe(fakeResult);
  });

  it('debe procesar correctamente un array vacío de reglas', async () => {
    jest
      .spyOn(ReglaCriteria, 'fromContext')
      .mockReturnValue({} as ReglaCriteria);

    repo = {
      findByCriteria: jest.fn().mockResolvedValue([]),
    } as unknown as ReglaRepository;

    const fakeResult: ReglaEngineResult = { debitAmount: 0 };
    jest.spyOn(RuleProcessor.prototype, 'process').mockReturnValue(fakeResult);

    service = new RulesOrchestrationService(repo);

    const result = await service.execute(fakeContext);

    expect(repo.findByCriteria).toHaveBeenCalled();
    expect(result).toEqual(fakeResult);
  });
});
