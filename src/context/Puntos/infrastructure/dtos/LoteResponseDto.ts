import { BatchEstado } from '../../core/enums/BatchEstado';
import { Lote } from '../../core/entities/Lote';

export class LoteResponseDto {
  id: string;
  clienteId: string;
  cantidadOriginal: number;
  remaining: number;
  estado: BatchEstado;
  createdAt: Date;
  updatedAt: Date;
  expiraEn: Date | null;
  origenTipo: string;
  referenciaId: string | null;

  // 👇 Agrega este método
  static fromDomain(this: void, lote: Lote): LoteResponseDto {
    const dto = new LoteResponseDto();
    dto.id = lote.id.value;
    dto.clienteId = lote.clienteId;
    dto.cantidadOriginal = lote.cantidadOriginal.value;
    dto.remaining = lote.remaining.value;
    dto.estado = lote.estado;
    dto.createdAt = lote.createdAt;
    dto.updatedAt = lote.updatedAt;
    dto.expiraEn = lote.expiraEn ? lote.expiraEn.value : null;
    dto.origenTipo = lote.origenTipo.value;
    dto.referenciaId = lote.referenciaId ? lote.referenciaId.value : null;
    return dto;
  }
}
