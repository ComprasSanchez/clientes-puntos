import { InvalidUUIDError } from '@shared/core/exceptions/InvalidUUIDError';
import { ClienteId } from '../../value-objects/ClienteId';

describe('ClienteId VO', () => {
  it('acepta un valor no vacío', () => {
    expect(() => new ClienteId('any-id')).toThrow(InvalidUUIDError);
  });

  it('lanza si el valor es vacío', () => {
    expect(() => new ClienteId('')).toThrow(/no puede estar vacío/);
  });
});
