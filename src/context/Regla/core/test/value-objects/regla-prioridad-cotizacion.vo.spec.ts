import { PrioridadReservadaError } from '../../exceptions/PrioridadReservadaError';
import { ReglaPrioridadCotizacion } from '../../value-objects/ReglaPrioridadCotizacion';

describe('ReglaPrioridadCotizacion', () => {
  it('acepta valor 0', () => {
    expect(new ReglaPrioridadCotizacion(0).value).toBe(0);
  });

  it('lanza PrioridadReservadaError si value != 0', () => {
    expect(() => new ReglaPrioridadCotizacion(1)).toThrow(
      PrioridadReservadaError,
    );
  });
});
