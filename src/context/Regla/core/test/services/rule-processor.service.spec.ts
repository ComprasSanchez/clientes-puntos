/* eslint-disable @typescript-eslint/unbound-method */
import { Regla } from '../../entities/Regla';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../../interfaces/IReglaEngine';
import { RuleProcessor } from '../../services/RuleProcessor';

describe('RuleProcessor', () => {
  let processor: RuleProcessor;
  const context = {} as ReglaEngineRequest;

  beforeEach(() => {
    processor = new RuleProcessor();
  });

  it('devuelve { debitAmount: 0 } para una lista vacía', () => {
    const result = processor.process([], context);
    expect(result).toEqual<ReglaEngineResult>({ debitAmount: 0 });
  });

  it('acumula débitos y asigna sólo el primer crédito, sin excluyentes', () => {
    // Creamos reglas parciales y las casteamos como Regla
    const rule1 = {
      prioridad: { value: 1 },
      excluyente: { value: false },
      apply: jest.fn().mockReturnValue({ debitAmount: 5 }),
    } as unknown as Regla;

    const rule2 = {
      prioridad: { value: 2 },
      excluyente: { value: false },
      apply: jest.fn().mockReturnValue({
        debitAmount: 3,
        credito: { cantidad: 10, expiraEn: new Date('2025-12-31') },
      }),
    } as unknown as Regla;

    const rule3 = {
      prioridad: { value: 0 },
      excluyente: { value: false },
      apply: jest.fn().mockReturnValue({ debitAmount: 2 }),
    } as unknown as Regla;

    const result = processor.process([rule1, rule2, rule3], context);

    // Total de débitos: 3 + 5 + 2 = 10
    expect(result.debitAmount).toBe(10);
    // Solo el crédito de la regla de mayor prioridad
    expect(result.credito).toEqual({
      cantidad: 10,
      expiraEn: new Date('2025-12-31'),
    });

    // Verificamos que apply se llamó con el contexto en cada regla
    expect(rule2.apply).toHaveBeenCalledWith(context);
    expect(rule1.apply).toHaveBeenCalledWith(context);
    expect(rule3.apply).toHaveBeenCalledWith(context);
  });

  it('respeta la prioridad al ordenar las reglas', () => {
    const executionOrder: number[] = [];
    const makeRule = (prio: number) =>
      ({
        prioridad: { value: prio },
        excluyente: { value: false },
        apply: jest.fn().mockImplementation(() => {
          executionOrder.push(prio);
          return {};
        }),
      }) as unknown as Regla;

    const rules = [makeRule(5), makeRule(1), makeRule(3)];
    processor.process(rules, context);

    // Deben ejecutarse en orden de prioridad descendente: 5, 3, 1
    expect(executionOrder).toEqual([5, 3, 1]);
  });

  it('detiene la ejecución cuando encuentra una regla excluyente', () => {
    const rule1 = {
      prioridad: { value: 2 },
      excluyente: { value: false },
      apply: jest.fn().mockReturnValue({ debitAmount: 2 }),
    } as unknown as Regla;

    const rule2 = {
      prioridad: { value: 1 },
      excluyente: { value: true },
      apply: jest.fn().mockReturnValue({ debitAmount: 4 }),
    } as unknown as Regla;

    const rule3 = {
      prioridad: { value: 0 },
      excluyente: { value: false },
      apply: jest.fn().mockReturnValue({ debitAmount: 100 }),
    } as unknown as Regla;

    const result = processor.process([rule1, rule2, rule3], context);

    // Sólo rule2 y rule1 se aplican: 2 + 4 = 6
    expect(result.debitAmount).toBe(6);
    // La regla 3 no debe ejecutarse
    expect(rule3.apply).not.toHaveBeenCalled();
  });
});
