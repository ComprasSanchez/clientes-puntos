import { TxTipo } from '../../core/enums/TxTipo';
import { CantidadPuntos } from '../../core/value-objects/CantidadPuntos';
import { LoteId } from '../../core/value-objects/LoteId';
import { ReferenciaMovimiento } from '../../core/value-objects/ReferenciaMovimiento';

export interface CreateTransaccionDto {
  loteId: LoteId;
  tipo: TxTipo;
  cantidad: CantidadPuntos;
  referenciaId?: ReferenciaMovimiento;
  fechaCreacion?: Date;
}
