import { ClientesUpsertFromPlexService } from './clientes-upsert-from-plex.service';

const clienteFake = (id: string, tarjeta: string) =>
  ({
    id: { value: id },
    fidelyStatus: { tarjetaFidely: { value: tarjeta } },
  }) as any;

describe('ClientesUpsertFromPlexService.fidelizar', () => {
  const make = (existing: unknown) => {
    const repo = { findByDni: jest.fn().mockResolvedValue(existing) } as any;
    const create = {
      run: jest.fn().mockResolvedValue(clienteFake('nuevo', '12345678')),
    } as any;
    const service = new ClientesUpsertFromPlexService(repo, create, {} as any);
    return { service, create };
  };

  it('crea con tarjeta virtual (tarjeta = DNI) si no existe', async () => {
    const { service, create } = make(null);

    const res = await service.fidelizar(' 12345678 ');

    expect(create.run).toHaveBeenCalledWith({ dni: '12345678' }, true);
    expect(res).toEqual({
      clienteId: 'nuevo',
      tarjetaFidely: '12345678',
      created: true,
    });
  });

  it('si ya está fidelizado no lo toca', async () => {
    const { service, create } = make(clienteFake('existente', '9990001'));

    const res = await service.fidelizar('12345678');

    expect(create.run).not.toHaveBeenCalled();
    expect(res).toEqual({
      clienteId: 'existente',
      tarjetaFidely: '9990001',
      created: false,
    });
  });
});
