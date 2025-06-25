import { CategoriaNombre } from '../../value-objects/CategoriaNombre';

describe('CategoriaNombre VO', () => {
  it('acepta nombres válidos (letras y espacios, 2-20 caracteres)', () => {
    expect(() => new CategoriaNombre('Gold')).not.toThrow();
    expect(() => new CategoriaNombre('Mi Categoría')).not.toThrow();
    expect(() => new CategoriaNombre('gold')).not.toThrow();
    expect(() => new CategoriaNombre('Ñandú')).not.toThrow();
  });

  it('elimina espacios al inicio y fin (trim)', () => {
    const vo = new CategoriaNombre('  Plata  ');
    expect(vo.value).toBe('Plata');
  });

  it('lanza si es vacío o sólo espacios', () => {
    expect(() => new CategoriaNombre('')).toThrow(/no puede estar vacío/);
    expect(() => new CategoriaNombre('   ')).toThrow(/no puede estar vacío/);
  });

  it('lanza si es muy corto (<2 caracteres)', () => {
    expect(() => new CategoriaNombre('A')).toThrow(
      /Debe tener un mínimo de 2 carácteres/,
    );
  });

  it('lanza si supera longitud máxima (>20 caracteres)', () => {
    const longName = 'A'.repeat(21);
    expect(() => new CategoriaNombre(longName)).toThrow(
      /Debe tener un máximo de 20 carácteres/,
    );
  });

  it('lanza si contiene dígitos o símbolos no permitidos', () => {
    expect(() => new CategoriaNombre('Cat3goría')).toThrow();
    expect(() => new CategoriaNombre('Cat#goría')).toThrow();
  });
});
