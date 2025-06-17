import { ClienteStatus, StatusCliente } from '../../value-objects/ClienteStatus';

describe('ClienteStatus VO', () => {
  it('acepta los tres estados válidos', () => {
    Object.values(StatusCliente).forEach((s) => {
      expect(() => new ClienteStatus(s)).not.toThrow();
      expect(new ClienteStatus(s).value).toBe(s);
    });
  });

  it('lanza si el estado no es válido', () => {
    expect(() => new ClienteStatus('otro')).toThrow(/no es un valor permitido/);
  });
});
