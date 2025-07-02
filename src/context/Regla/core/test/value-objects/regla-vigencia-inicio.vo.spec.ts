import { InvalidFormatError } from '@shared/core/exceptions/InvalidFormatError';
import { InvalidDateError } from '@shared/core/exceptions/InvalidDateError';
import { ReglaVigenciaInicio } from '../../value-objects/ReglaVigenciaInicio';

describe('ReglaVigenciaInicio', () => {
  it('acepta fechas <= hoy', () => {
    const today = new Date();
    expect(new ReglaVigenciaInicio(today).toString()).toBe(
      today.toISOString().split('T')[0],
    );
  });

  it('lanza InvalidFormatError si no es fecha válida', () => {
    expect(() => new ReglaVigenciaInicio(new Date('foo'))).toThrow(
      InvalidFormatError,
    );
  });

  it('lanza InvalidDateError si la fecha es en el futuro', () => {
    const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(() => new ReglaVigenciaInicio(mañana)).toThrow(InvalidDateError);
  });
});
