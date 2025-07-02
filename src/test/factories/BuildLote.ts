import { Lote } from '@puntos/core/entities/Lote';
import { BatchEstado } from '@puntos/core/enums/BatchEstado';
import { CantidadPuntos } from '@puntos/core/value-objects/CantidadPuntos';
import { FechaExpiracion } from '@puntos/core/value-objects/FechaExpiracion';
import { LoteId } from '@puntos/core/value-objects/LoteId';
import { OrigenOperacion } from '@puntos/core/value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '@puntos/core/value-objects/ReferenciaMovimiento';

/**
 * Factory for Lote domain entity.
 */
export function buildLote(
  overrides?: Partial<{
    id: string;
    clienteId: string;
    cantidadOriginal: number;
    remaining: number;
    estado: BatchEstado;
    createdAt: Date;
    expiraEn: Date | null;
    origenTipo: string;
    referenciaId?: string;
  }>,
): Lote {
  const {
    id = '00000000-0000-0000-0000-000000000002',
    clienteId = 'cliente-123',
    cantidadOriginal = 10000,
    remaining = 10000,
    estado = BatchEstado.DISPONIBLE,
    createdAt = new Date(),
    expiraEn = null,
    origenTipo = 'TEST',
    referenciaId = '1234567891234567',
  } = overrides || {};

  return new Lote(
    new LoteId(id),
    clienteId,
    new CantidadPuntos(cantidadOriginal),
    new CantidadPuntos(remaining),
    estado,
    createdAt,
    expiraEn ? new FechaExpiracion(expiraEn) : null,
    new OrigenOperacion(origenTipo),
    referenciaId ? new ReferenciaMovimiento(referenciaId) : undefined,
  );
}
