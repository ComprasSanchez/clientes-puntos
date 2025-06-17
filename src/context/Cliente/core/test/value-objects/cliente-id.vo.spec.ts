import { ClienteId } from '../../value-objects/ClienteId';

describe('ClienteId VO', () => {
  it('acepta un valor no vacío', () => {
    expect(() => new ClienteId('any-id')).not.toThrow();
  });

  it('lanza si el valor es vacío', () => {
    expect(() => new ClienteId('')).toThrow(
      'El ID del cliente no puede ser vacío.',
    );
  });
});
