import { Transaccion } from '@puntos/core/entities/Transaccion';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { OperacionId } from '@puntos/core/value-objects/OperacionId';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';
import { TransaccionId } from '@puntos/core/value-objects/TransaccionId';

/**
 * Factory for Transaccion domain entity.
 */
export function buildTransaccion(
  overrides?: Partial<{
    id: string;
    operationId: number;
    loteId: string;
    tipo: TxTipo;
    cantidad: number;
    createdAt: Date;
    referenciaId?: string;
  }>,
): Transaccion {
  const {
    id = '00000000-0000-0000-0000-000000000003',
    operationId = 12345679123,
    loteId = '00000000-0000-0000-0000-000000000002',
    tipo = TxTipo.ACREDITACION,
    cantidad = 10,
    createdAt = new Date(),
    referenciaId,
  } = overrides || {};

  return Transaccion.createOrphan({
    id: new TransaccionId(id),
    operationId: OperacionId.instance(operationId),
    loteId: new LoteId(loteId),
    tipo,
    cantidad: new CantidadPuntos(cantidad),
    createdAt,
    reglasAplicadas: {},
    referenciaId: referenciaId
      ? new ReferenciaMovimiento(referenciaId)
      : undefined,
  });
}
