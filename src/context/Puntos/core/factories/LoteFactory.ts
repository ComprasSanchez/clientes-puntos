// src/context/Puntos/core/factories/LoteFactory.ts
import { UUIDGenerator } from 'src/shared/core/uuid/UuidGenerator';
import { Lote } from '../entities/Lote';
import { LoteId } from '../value-objects/LoteId';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { FechaExpiracion } from '../value-objects/FechaExpiracion';
import { OrigenOperacion } from '../value-objects/OrigenOperacion';
import { ReferenciaMovimiento } from '../value-objects/ReferenciaMovimiento';
import { BatchEstado } from '../enums/BatchEstado';

export interface LoteCreationParams {
  clienteId: string;
  cantidad: CantidadPuntos;
  origen: OrigenOperacion;
  referencia?: ReferenciaMovimiento;
  expiraEn?: FechaExpiracion;
}

export class LoteFactory {
  constructor(private readonly idGen: UUIDGenerator) {}

  /**
   * Crea un Lote con ID generado y estado inicial DISPONIBLE.
   */
  crear(params: LoteCreationParams): Lote {
    const id = new LoteId(this.idGen.generate());
    return new Lote(
      id,
      params.clienteId,
      params.cantidad,
      params.cantidad,
      BatchEstado.DISPONIBLE,
      new Date(),
      params.expiraEn ?? null,
      params.origen,
      params.referencia,
    );
  }
}
