// @regla/domain/services/RuleProcessor.ts

import { Regla } from '../entities/Regla';
import {
  ReglaEngineRequest,
  ReglaEngineResult,
} from '../interfaces/IReglaEngine';

export class RuleProcessor {
  public process(
    rules: Regla[],
    context: ReglaEngineRequest,
  ): ReglaEngineResult {
    const sorted = [...rules].sort(
      (a, b) => a.prioridad.value - b.prioridad.value,
    );

    const resultado: ReglaEngineResult = {
      debitAmount: 0,
      reglasAplicadas: {},
    };

    for (const regla of sorted) {
      const parcial = regla.apply(context);

      const huboDebito = (parcial.debitAmount ?? 0) > 0;
      const huboCredito =
        !!parcial.credito && (parcial.credito.cantidad ?? 0) > 0;
      const huboEfecto = huboDebito || huboCredito;

      // Acumular débitos
      if (huboDebito) {
        resultado.debitAmount += parcial.debitAmount;
      }

      // ⬅️ Acumular créditos (sumar cantidades y elegir expiración más próxima)
      if (huboCredito) {
        const anterior = resultado.credito;
        const nuevaCantidad =
          (anterior?.cantidad ?? 0) + (parcial.credito!.cantidad ?? 0);

        let expiraEn: Date | undefined =
          anterior?.expiraEn ?? parcial.credito!.expiraEn;
        if (anterior?.expiraEn && parcial.credito!.expiraEn) {
          expiraEn = new Date(
            Math.min(
              anterior.expiraEn.getTime(),
              parcial.credito!.expiraEn.getTime(),
            ),
          );
        }

        resultado.credito = { cantidad: nuevaCantidad, expiraEn };
      }

      // Registrar regla aplicada solo si produjo efecto
      if (huboEfecto) {
        const tipo = regla.tipo;
        const reglaInfo = { id: regla.id.value, nombre: regla.nombre.value };
        if (!resultado.reglasAplicadas[tipo.value]) {
          resultado.reglasAplicadas[tipo.value] = [];
        }
        resultado.reglasAplicadas[tipo.value].push(reglaInfo);
      }

      // Cortar solo si es excluyente y hubo efecto
      if (regla.excluyente.value && huboEfecto) {
        break;
      }
    }

    return resultado;
  }
}
