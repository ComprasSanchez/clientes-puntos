import { FechaExpiracion } from '../../value-objects/FechaExpiracion';

describe('FechaExpiracion VO', () => {
  it('acepta fecha válida', () => {
    const d = new Date('2021-12-31');
    expect(() => new FechaExpiracion(d)).not.toThrow();
    expect(new FechaExpiracion(d).value).toEqual(d);
  });

  it('lanza si se pasa null', () => {
    expect(() => new FechaExpiracion(null)).toThrow(/no puede estar vacío/);
  });

  it('lanza si la fecha es inválida', () => {
    expect(() => new FechaExpiracion(new Date('invalid'))).toThrow(
      /Invalid time value/,
    );
  });

  it('toDate devuelve la fecha interna', () => {
    const fecha = new Date('2022-01-01');
    expect(new FechaExpiracion(fecha).toDate()).toEqual(fecha);
  });
});
