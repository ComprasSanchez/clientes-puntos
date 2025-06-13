import { ClienteIdFidely } from '../../ValueObjects/ClienteIdFidely';

describe('ClienteIdFidely VO', () => {
  it('acepta string no vacío', () => {
    expect(() => new ClienteIdFidely('FID123')).not.toThrow();
  });

  it('acepta null (nullable)', () => {
    expect(() => new ClienteIdFidely(null)).not.toThrow();
  });
});
