import { TxTipo } from '../../core/enums/TxTipo';
import { Transaccion } from '../../core/entities/Transaccion';

export class TransaccionResponseDto {
  id: string;
  operationId: number;
  loteId: string;
  tipo: TxTipo;
  cantidad: number;
  referenciaId?: string | null;
  reglasAplicadas: any;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(
    this: void,
    transaccion: Transaccion,
  ): TransaccionResponseDto {
    const dto = new TransaccionResponseDto();
    dto.id = transaccion.id.value;
    dto.operationId = transaccion.operationId.value;
    dto.loteId = transaccion.loteId.value;
    dto.tipo = transaccion.tipo;
    dto.cantidad = transaccion.cantidad.value;
    dto.referenciaId = transaccion.referenciaId?.value ?? null;
    dto.reglasAplicadas = transaccion.reglasAplicadas ?? undefined;
    dto.createdAt = transaccion.createdAt;
    dto.updatedAt = transaccion.updatedAt;
    return dto;
  }
}
