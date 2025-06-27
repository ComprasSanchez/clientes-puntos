// src/context/Regla/domain/services/RuleProcessor.ts

import { Regla } from '../entities/Regla';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../interfaces/IReglaEngine';

export class RuleProcessor {
  /**
   * Dada una lista pre-filtrada de Reglas, aplica cada una en orden (por prioridad),
   * acumula débitos/crédito y detiene si es excluyente.
   */
  public process(
    rules: Regla[],
    context: ReglaEngineRequest,
  ): ReglaEngineResult {
    // 1. Ordenar
    const sorted = [...rules].sort(
      (a, b) => b.prioridad.value - a.prioridad.value,
    );

    // 2. Aplicar y acumular
    const resultado: ReglaEngineResult = { debitAmount: 0 };

    for (const regla of sorted) {
      const parcial = regla.apply(context);

      if (parcial.debitAmount) {
        resultado.debitAmount += parcial.debitAmount;
      }
      if (parcial.credito && !resultado.credito) {
        resultado.credito = parcial.credito;
      }

      if (regla.excluyente.value) {
        break;
      }
    }

    return resultado;
  }
}
