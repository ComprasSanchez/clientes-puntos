import { ClienteApellido } from '../../value-objects/ClienteApellido';

describe('ClienteApellido VO', () => {
  it('acepta apellido válido', () => {
    expect(() => new ClienteApellido('Pérez')).not.toThrow();
  });

  it('acepta apellido compuesto', () => {
    expect(() => new ClienteApellido('De la Cruz')).not.toThrow();
  });

  it('lanza si contiene dígitos o todo en mayúsculas', () => {
    expect(() => new ClienteApellido('GARCIA')).toThrow();
    expect(() => new ClienteApellido('Garci4')).toThrow();
  });
});
