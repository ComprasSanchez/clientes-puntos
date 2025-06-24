import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';

/**
 * Detalle de una transacción resultante de la operación
 */
export interface CreateOperacionTransaccionDto {
  /** UUID de la transacción */
  id: string;
  /** UUID de la operación que originó esta transacción */
  operacionId: number;
  /** UUID del lote afectado */
  loteId: string;
  /** Tipo de transacción: GASTO o ACREDITACION */
  tipo: TxTipo;
  /** Cantidad de puntos movidos */
  cantidad: number;
  /** Fecha de creación de la transacción */
  createdAt: Date;
}

/**
 * DTO de respuesta luego de crear una Operación.
 */
export interface CreateOperacionResponse {
  /** UUID de la operación creada */
  operacionId: number;

  /** Lista de IDs de lotes que fueron modificados o creados */
  lotesAfectados: string[];

  /** Detalle de todas las transacciones generadas */
  transacciones: CreateOperacionTransaccionDto[];
}
