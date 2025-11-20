// src/application/services/operacion-valor.service.ts
import { TransaccionRepository } from '@puntos/core/repository/TransaccionRepository';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { Inject } from '@nestjs/common';
import { TX_REPO } from '@puntos/core/tokens/tokens';

export interface ValorOperacionResumido {
  puntosCredito: number;
  puntosDebito: number;
  puntosDelta: number;
}

export interface ValorOperacionDetallado extends ValorOperacionResumido {
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
}

export interface DetalleOperacionValor {
  operacion: Operacion;
  valor: ValorOperacionDetallado;
  transacciones: Transaccion[];
}

export class OperacionValorService {
  constructor(
    @Inject(TX_REPO) private readonly transaccionRepo: TransaccionRepository,
  ) {}

  /**
   * Calcula el valor de muchas operaciones (lista) en batch.
   * Usado para el endpoint de listado.
   */
  async calcularParaOperaciones(
    operaciones: Operacion[],
  ): Promise<Map<number, ValorOperacionDetallado>> {
    const result = new Map<number, ValorOperacionDetallado>();

    if (operaciones.length === 0) {
      return result;
    }

    const opIds = operaciones.map((o) => o.id.value);
    const transacciones = await this.transaccionRepo.findByOperacionIds(opIds);

    // inicializar en 0
    for (const op of operaciones) {
      result.set(op.id.value, {
        puntosCredito: 0,
        puntosDebito: 0,
        puntosDelta: 0,
        reglasAplicadas: {},
      });
    }

    for (const tx of transacciones) {
      const opId = tx.operationId.value;
      const entry = result.get(opId);
      if (!entry) continue;

      const cantidad = tx.cantidad.value;

      if (this.isCredito(tx)) {
        entry.puntosCredito += cantidad;
      } else if (this.isDebito(tx)) {
        entry.puntosDebito += cantidad;
      }

      entry.puntosDelta = entry.puntosCredito - entry.puntosDebito;

      // merge reglas
      const reglas = tx.reglasAplicadas ?? {};
      for (const key of Object.keys(reglas)) {
        if (!entry.reglasAplicadas[key]) {
          entry.reglasAplicadas[key] = [];
        }
        entry.reglasAplicadas[key].push(...reglas[key]);
      }
    }

    return result;
  }

  /**
   * Calcula valor + trae transacciones para UNA operación.
   * Usado para el endpoint de detalle.
   */
  async obtenerDetalleOperacion(
    operacion: Operacion,
  ): Promise<DetalleOperacionValor> {
    const transacciones = await this.transaccionRepo.findByOperationId(
      operacion.id.value,
    );

    let puntosCredito = 0;
    let puntosDebito = 0;
    const reglasAplicadas: Record<
      string,
      Array<{ id: string; nombre: string }>
    > = {};

    for (const tx of transacciones) {
      const cantidad = tx.cantidad.value;

      if (this.isCredito(tx)) {
        puntosCredito += cantidad;
      } else if (this.isDebito(tx)) {
        puntosDebito += cantidad;
      }

      const reglas = tx.reglasAplicadas ?? {};
      for (const key of Object.keys(reglas)) {
        if (!reglasAplicadas[key]) {
          reglasAplicadas[key] = [];
        }
        reglasAplicadas[key].push(...reglas[key]);
      }
    }

    const puntosDelta = puntosCredito - puntosDebito;

    const valor: ValorOperacionDetallado = {
      puntosCredito,
      puntosDebito,
      puntosDelta,
      reglasAplicadas,
    };

    return {
      operacion,
      valor,
      transacciones,
    };
  }

  // Helpers privados para clasificar el tipo de Tx
  private isCredito(tx: Transaccion): boolean {
    return tx.tipo === TxTipo.ACREDITACION;
  }

  private isDebito(tx: Transaccion): boolean {
    return tx.tipo === TxTipo.GASTO;
  }
}
