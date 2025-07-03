import { TxTipo } from '../../core/enums/TxTipo';

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
}
