/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @puntos/infrastructure/services/ReglaEngineServiceInMemory.ts

import {
  ReglaEngine,
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../../core/interfaces/IReglaEngine';

/**
 * Un ReglaEngine “stub” para pruebas o entornos in‐memory.
 * Por defecto devuelve siempre debitAmount = 0 y sin créditos.
 * Se puede parametrizar por constructor si se quiere simular distintos escenarios.
 */
export class ReglaEngineServiceInMemory implements ReglaEngine {
  constructor(
    private readonly resultadoStub: ReglaEngineResult = {
      debitAmount: 0,
      reglasAplicadas: {},
    },
  ) {}

  async procesar(_req: ReglaEngineRequest): Promise<ReglaEngineResult> {
    // Devuelve siempre el resultado “stub” configurado
    return this.resultadoStub;
  }
}
