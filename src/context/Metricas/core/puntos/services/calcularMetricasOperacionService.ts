import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { OpTipo } from '@shared/core/enums/OpTipo';
import { MetricasOperacion } from 'src/context/Metricas/core/puntos/entities/MetricasOperacion';

export class CalcularMetricasOperacionService {
  constructor() {}

  calcular(
    ops: Operacion[],
    txs: Transaccion[],
    fecha: Date,
  ): MetricasOperacion {
    const cantidadOperaciones = Number(ops.length);

    // 2. Inicializar métricas
    let puntosAcreditados = 0;
    let puntosGastados = 0;
    const distribucionOperaciones: Record<string, number> = {
      compra: 0,
      devolucion: 0,
      anulacion: 0,
      ajuste: 0,
    };

    // 3. Procesar operaciones una a una
    for (const op of ops) {
      // -- Distribución por tipo de operación (asumiendo op.tipo es OpTipo)
      switch (op.tipo) {
        case OpTipo.COMPRA:
          distribucionOperaciones.compra++;
          break;
        case OpTipo.DEVOLUCION:
          distribucionOperaciones.devolucion++;
          break;
        case OpTipo.ANULACION:
          distribucionOperaciones.anulacion++;
          break;
        case OpTipo.AJUSTE:
          distribucionOperaciones.ajuste++;
          break;
      }
    }

    // -- Sumar puntos acreditados/gastados del día

    for (const tx of txs) {
      if (tx.tipo === TxTipo.ACREDITACION)
        puntosAcreditados += tx.cantidad.value;
      if (tx.tipo === TxTipo.GASTO) puntosGastados += tx.cantidad.value;
    }

    // 4. Crear y guardar la métrica
    return new MetricasOperacion(
      fecha,
      cantidadOperaciones,
      puntosAcreditados,
      puntosGastados,
      distribucionOperaciones as {
        compra: number;
        devolucion: number;
        anulacion: number;
        ajuste: number;
      },
    );
  }
}
