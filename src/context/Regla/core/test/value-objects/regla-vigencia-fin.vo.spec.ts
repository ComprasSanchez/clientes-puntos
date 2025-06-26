import { InvalidFormatError } from 'src/shared/core/exceptions/InvalidFormatError';
import { ReglaVigenciaFin } from '../../value-objects/ReglaVigenciaFin';

describe('ReglaVigenciaFin', () => {
  it('acepta fechas válidas', () => {
    const d = new Date('2025-01-01');
    expect(new ReglaVigenciaFin(d).toString()).toBe('2025-01-01');
  });

  it('lanza InvalidFormatError si no es fecha válida', () => {
    expect(() => new ReglaVigenciaFin(new Date('invalid'))).toThrow(
      InvalidFormatError,
    );
  });
});
