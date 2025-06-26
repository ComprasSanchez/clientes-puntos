import { InvalidBooleanError } from 'src/shared/core/exceptions/InvalidBooleanError';
import { ReglaFlag } from '../../value-objects/ReglaFlag';

describe('ReglaFlag', () => {
  it('acepta true y false', () => {
    expect(new ReglaFlag(true).value).toBe(true);
    expect(new ReglaFlag(false).value).toBe(false);
  });

  it('lanza InvalidBooleanError si no es booleano', () => {
    // @ts-expect-error: prueba intencionalmente inválida
    expect(() => new ReglaFlag('true')).toThrow(InvalidBooleanError);
  });
});
