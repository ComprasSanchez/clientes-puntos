import { ClienteFechaAlta } from '../../value-objects/ClienteFechaAlta';

describe('ClienteFechaAlta VO', () => {
  it('acepta fecha válida no futura', () => {
    expect(() => new ClienteFechaAlta(new Date())).not.toThrow();
  });

  it('lanza si no es Date válido', () => {
    expect(() => new ClienteFechaAlta(new Date('invalid'))).toThrow();
  });

  it('lanza si la fecha es futura', () => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    expect(() => new ClienteFechaAlta(mañana)).toThrow(
      /no puede ser en el futuro/,
    );
  });
});
