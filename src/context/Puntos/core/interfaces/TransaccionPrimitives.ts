import { TxTipo } from '../enums/TxTipo';

export interface TransaccionPrimitives {
  _id: string;
  _operationId: number;
  _loteId: string;
  _tipo: TxTipo;
  _cantidad: number;
  _createdAt: string; // ISO Date string
  _reglasAplicadas: Record<string, Array<{ id: string; nombre: string }>>;
  _referenciaId?: string | null;
}
