import { ClienteFechaNacimiento } from '../../ValueObjects/ClienteFechaNacimiento';

describe('ClienteFechaNacimiento VO', () => {
  it('acepta fecha pasada válida', () => {
    expect(
      () => new ClienteFechaNacimiento(new Date('2000-01-01')),
    ).not.toThrow();
  });

  it('lanza si no es una fecha válida', () => {
    expect(() => new ClienteFechaNacimiento(new Date('invalid'))).toThrow();
  });

  it('lanza si la fecha es futura', () => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    expect(() => new ClienteFechaNacimiento(mañana)).toThrow(
      /no puede ser futura/,
    );
  });
});
