import { PrioridadReservadaError } from '../exceptions/PrioridadReservadaError';
import { ReglaPrioridad } from './ReglaPrioridad';

export class ReglaPrioridadCotizacion extends ReglaPrioridad {
  constructor(value: number) {
    super(value);
    if (value != 0) throw new PrioridadReservadaError();
  }
}
