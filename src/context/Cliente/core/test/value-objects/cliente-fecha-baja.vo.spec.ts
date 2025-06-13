import { ClienteFechaBaja } from '../../ValueObjects/ClienteFechaBaja';

describe('ClienteFechaBaja VO', () => {
  it('acepta null (nullable)', () => {
    expect(() => new ClienteFechaBaja(null)).not.toThrow();
    expect(new ClienteFechaBaja(null).value).toBeNull();
  });

  it('acepta fecha válida pasada', () => {
    expect(() => new ClienteFechaBaja(new Date('2020-01-01'))).not.toThrow();
  });

  it('lanza si no es Date válido', () => {
    expect(() => new ClienteFechaBaja(new Date('invalid'))).toThrow();
  });

  it('lanza si la fecha es futura', () => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    expect(() => new ClienteFechaBaja(mañana)).toThrow(
      /no puede ser en el futuro/,
    );
  });
});
