import { Transaccion } from '@puntos/core/entities/Transaccion';
import { Operacion } from '@puntos/core/entities/Operacion';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { OpTipo } from '@shared/core/enums/OpTipo'; // Asumo que tenés este enum
import { ConversionRule } from '@regla/core/entities/ConversionRule';
import { valorPuntoEnPesos } from '@shared/core/utils/puntoToMoneda';

export interface MovimientoOperacion {
  tipoOperacion: OpTipo;
  tipoTransaccion: TxTipo;
  puntos: number;
  cotizacion: number;
  fecha: Date;
}

export class ClienteMetricsCalculator {
  static calcularDesdeOperacion(
    operacion: Operacion,
    transacciones: Transaccion[],
    cotizacion: ConversionRule,
  ) {
    const movimientos: MovimientoOperacion[] = transacciones.map((tx) => ({
      tipoOperacion: operacion.tipo,
      tipoTransaccion: tx.tipo,
      puntos: tx.cantidad.value,
      cotizacion: valorPuntoEnPesos(cotizacion.rateSpendVo.value),
      fecha: tx.createdAt,
    }));

    return {
      pesosAhorrados: this.calcularPesosAhorrados(movimientos),
      puntosAdquiridos: this.calcularPuntosAdquiridos(movimientos),
    };
  }

  static calcularPesosAhorrados(movs: MovimientoOperacion[]): number {
    return movs.reduce((total, mov) => {
      // COMPRA + GASTO => Suma en positivo
      if (
        mov.tipoOperacion === OpTipo.COMPRA &&
        mov.tipoTransaccion === TxTipo.GASTO
      ) {
        return total + mov.puntos * mov.cotizacion;
      }
      // ANULACION + ACREDITACION => Suma en negativo
      if (
        mov.tipoOperacion === OpTipo.ANULACION &&
        mov.tipoTransaccion === TxTipo.ACREDITACION
      ) {
        return total - mov.puntos * mov.cotizacion;
      }
      return total;
    }, 0);
  }

  static calcularPuntosAdquiridos(movs: MovimientoOperacion[]): number {
    return movs
      .filter(
        (mov) =>
          mov.tipoTransaccion === TxTipo.ACREDITACION &&
          [OpTipo.COMPRA, OpTipo.AJUSTE, OpTipo.ANULACION].includes(
            mov.tipoOperacion,
          ),
      )
      .reduce((total, mov) => total + mov.puntos, 0);
  }
}
