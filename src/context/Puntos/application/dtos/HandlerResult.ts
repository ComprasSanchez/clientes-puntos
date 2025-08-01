import { Lote } from '@puntos/core/entities/Lote';
import { Operacion } from '@puntos/core/entities/Operacion';
import { Transaccion } from '@puntos/core/entities/Transaccion';

export interface HandlerResult {
  nuevoLote?: Lote | undefined;
  lotesActualizados: Lote[];
  transacciones: Transaccion[];
  operacion: Operacion;
  saldoNuevo: number;
  saldoAnterior: number;
}
