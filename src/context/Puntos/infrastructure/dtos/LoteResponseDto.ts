// dtos/LoteResponseDto.ts
import { BatchEstado } from '../../core/enums/BatchEstado';

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
}
