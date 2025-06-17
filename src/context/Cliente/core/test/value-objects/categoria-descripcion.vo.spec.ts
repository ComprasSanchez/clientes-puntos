import { CategoriaDescripcion } from '../../value-objects/CategoriaDescripcion';

describe('CategoriaDescripcion VO', () => {
  it('acepta null o undefined (nullable)', () => {
    expect(() => new CategoriaDescripcion(null)).not.toThrow();
    expect(() => new CategoriaDescripcion()).not.toThrow();
  });

  it('acepta cadenas de texto hasta 200 caracteres', () => {
    expect(() => new CategoriaDescripcion('Descripción válida')).not.toThrow();
    const max200 = 'X'.repeat(200);
    expect(() => new CategoriaDescripcion(max200)).not.toThrow();
  });

  it('normaliza trim en la descripción', () => {
    const desc = new CategoriaDescripcion('  hola mundo  ');
    expect(desc.value).toBe('hola mundo');
  });

  it('lanza si supera 200 caracteres', () => {
    const tooLong = 'A'.repeat(201);
    expect(() => new CategoriaDescripcion(tooLong)).toThrowError(
      /no puede superar 200 caracteres/,
    );
  });
});
