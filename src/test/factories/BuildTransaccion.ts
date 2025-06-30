import { Transaccion } from 'src/context/Puntos/core/entities/Transaccion';
import { TxTipo } from 'src/context/Puntos/core/enums/TxTipo';
import { CantidadPuntos } from 'src/context/Puntos/core/value-objects/CantidadPuntos';
import { LoteId } from 'src/context/Puntos/core/value-objects/LoteId';
import { OperacionId } from 'src/context/Puntos/core/value-objects/OperacionId';
import { ReferenciaMovimiento } from 'src/context/Puntos/core/value-objects/ReferenciaMovimiento';
import { TransaccionId } from 'src/context/Puntos/core/value-objects/TransaccionId';

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
    referenciaId: referenciaId
      ? new ReferenciaMovimiento(referenciaId)
      : undefined,
  });
}
