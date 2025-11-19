// @puntos/infrastructure/http/dtos/TransaccionDetalleDto.ts
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { Transaccion } from '@puntos/core/entities/Transaccion';

export class TransaccionDetalleDto {
  id: string;
  operationId: number;
  loteId: string;
  tipo: TxTipo;
  cantidad: number;
  createdAt: Date;
  referenciaId?: string | null;
  reglasAplicadas?: Record<string, Array<{ id: string; nombre: string }>>;

  static fromDomain(tx: Transaccion): TransaccionDetalleDto {
    const dto = new TransaccionDetalleDto();
    dto.id = tx.id.value;
    dto.operationId = tx.operationId.value;
    dto.loteId = tx.loteId.value;
    dto.tipo = tx.tipo;
    dto.cantidad = tx.cantidad.value;
    dto.createdAt = tx.createdAt;
    dto.referenciaId = tx.referenciaId?.value ?? null;
    dto.reglasAplicadas = tx.reglasAplicadas;
    return dto;
  }
}
