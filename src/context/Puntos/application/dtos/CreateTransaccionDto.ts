import { TxTipo } from '../../core/enums/TxTipo';
import { CantidadPuntos } from '../../core/value-objects/CantidadPuntos';
import { LoteId } from '../../core/value-objects/LoteId';
import { OperacionId } from '../../core/value-objects/OperacionId';
import { ReferenciaMovimiento } from '../../core/value-objects/ReferenciaMovimiento';

export interface CreateTransaccionDto {
  operacionId: OperacionId;
  loteId: LoteId;
  tipo: TxTipo;
  cantidad: CantidadPuntos;
  referenciaId?: ReferenciaMovimiento;
  fechaCreacion?: Date;
}
