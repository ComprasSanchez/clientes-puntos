import { ClienteSexo } from '../../value-objects/ClienteSexo';

describe('ClienteSexo VO', () => {
  it('normaliza y acepta "m", "f" y "x"', () => {
    expect(new ClienteSexo('m').value).toBe('M');
    expect(new ClienteSexo('F').value).toBe('F');
    expect(new ClienteSexo('x').value).toBe('X');
  });

  it('lanza si no es M, F o X', () => {
    expect(() => new ClienteSexo('Z')).toThrow(
      /no es uno de los valores permitidos/,
    );
  });
});
