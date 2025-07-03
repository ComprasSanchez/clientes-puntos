import { UUIDGenerator } from '@shared/core/uuid/UuidGenerator';
import { Transaccion } from '../entities/Transaccion';
import { TransaccionId } from '../value-objects/TransaccionId';
import { OperacionId } from '../value-objects/OperacionId';
import { LoteId } from '../value-objects/LoteId';
import { TxTipo } from '../enums/TxTipo';
import { CantidadPuntos } from '../value-objects/CantidadPuntos';
import { ReferenciaMovimiento } from '../value-objects/ReferenciaMovimiento';

export interface CreateTransaccionParams {
  operacionId: OperacionId;
  loteId: LoteId;
  tipo: TxTipo;
  cantidad: CantidadPuntos;
  reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
  referenciaId?: ReferenciaMovimiento;
  fechaCreacion?: Date;
}

export class TransaccionFactory {
  constructor(private readonly idGen: UUIDGenerator) {}

  /**
   * Crea una Transaccion lista para persistir,
   * con su ID generado y mapeando el DTO.
   */
  createFromDto(params: CreateTransaccionParams): Transaccion {
    const fecha = params.fechaCreacion ?? new Date();
    const id = new TransaccionId(this.idGen.generate());

    return Transaccion.createOrphan({
      id,
      operationId: params.operacionId,
      loteId: params.loteId,
      tipo: params.tipo,
      cantidad: params.cantidad,
      createdAt: fecha,
      referenciaId: params.referenciaId,
      reglasAplicadas: params.reglasAplicadas,
    });
  }
}
