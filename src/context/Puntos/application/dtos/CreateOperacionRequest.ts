import { OpTipo } from '@shared/core/enums/OpTipo';
import { OrigenOperacion } from '../../core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '../../core/value-objects/ReferenciaMovimiento';
import { OperacionId } from '../../core/value-objects/OperacionId';

/**
 * DTO para la petición de creación de una Operacion.
 */
export interface CreateOperacionRequest {
  /** Identificador del cliente que realiza la operación */
  clienteId: string;

  /** Tipo de operación: COMPRA, DEVOLUCION, ANULACION, EXPIRACION */
  tipo: OpTipo;

  origenTipo: OrigenOperacion;

  /** Cantidad de puntos (solo para operaciones de gasto) */
  puntos?: number;

  /** Monto en moneda (solo para operaciones de compra con moneda) */
  montoMoneda?: number;

  /** Código ISO de la moneda (p.e. 'ARS', 'USD') */
  moneda?: string;

  /** Referencia externa o de sistema (opcional) */
  referencia?: ReferenciaMovimiento;

  /** Id de la Operacion para acciones de devolucion y/o anulacion */
  operacionId?: OperacionId;

  codSucursal?: string;
}
