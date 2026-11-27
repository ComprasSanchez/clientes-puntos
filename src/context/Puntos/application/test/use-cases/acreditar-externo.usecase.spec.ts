/* eslint-disable @typescript-eslint/unbound-method */
import { AcreditarExternoUseCase } from '@puntos/application/use-cases/Ajuste/AcreditarExterno';
import { AjusteUseCase } from '@puntos/application/use-cases/Ajuste/Ajuste';
import { candidatosDni } from '@puntos/application/utils/dni-candidatos';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { Ajuste } from '@puntos/core/entities/Ajuste';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { AjusteRepository } from '@puntos/core/repository/AjusteRepository';

const CLIENTE = '00000000-0000-4000-8000-000000000001';
const base = {
  puntos: 500,
  motivo: 'Trivia calendario de fin de año (7/12)',
  origenTipo: 'CALENDARIO_FIN_DE_ANIO',
  claveExterna: 'calendario:FIN_DE_ANIO_2026:2026-12-07:c1',
};
const clienteCon = (id: string) => ({ id: { value: id } });

describe('AcreditarExternoUseCase', () => {
  let guardados: Ajuste[];
  let repo: jest.Mocked<AjusteRepository>;
  let clientes: { findById: jest.Mock; findByDNICandidates: jest.Mock };
  let ajuste: jest.Mocked<Pick<AjusteUseCase, 'run'>>;
  let useCase: AcreditarExternoUseCase;

  beforeEach(() => {
    guardados = [];
    repo = {
      save: jest.fn(),
      findByClaveExterna: jest.fn((clave: string) =>
        Promise.resolve(
          guardados.find((a) => a.claveExterna === clave) ?? null,
        ),
      ),
    };
    clientes = {
      findById: jest.fn((id: { value: string }) =>
        Promise.resolve(id.value === CLIENTE ? clienteCon(CLIENTE) : null),
      ),
      findByDNICandidates: jest.fn((c: string[]) =>
        Promise.resolve(c.includes('0030111222') ? clienteCon(CLIENTE) : null),
      ),
    };
    ajuste = {
      run: jest.fn((tipo: TxTipo, usuarioId: string, dto) => {
        guardados.push(
          new Ajuste(
            'a1',
            usuarioId,
            dto.clienteId,
            tipo,
            dto.puntos,
            new Date(),
            dto.motivo,
            dto.claveExterna,
          ),
        );
        return Promise.resolve({} as never);
      }),
    };
    useCase = new AcreditarExternoUseCase(
      repo,
      clientes as unknown as ClienteRepository,
      ajuste as unknown as AjusteUseCase,
    );
  });

  it('acredita con la clave externa y el motivo', async () => {
    const r = await useCase.run('svc', { ...base, clienteId: CLIENTE });
    expect(r).toEqual({ acreditado: true, ajusteId: 'a1', clienteId: CLIENTE });
    expect(ajuste.run).toHaveBeenCalledWith(
      TxTipo.ACREDITACION,
      'svc',
      expect.objectContaining({ puntos: 500, claveExterna: base.claveExterna }),
      undefined,
    );
  });

  it('con la misma clave no acredita dos veces', async () => {
    await useCase.run('svc', { ...base, clienteId: CLIENTE });
    const segunda = await useCase.run('svc', { ...base, clienteId: CLIENTE });
    expect(segunda.acreditado).toBe(false);
    expect(ajuste.run).toHaveBeenCalledTimes(1);
  });

  it('sin clienteId lo busca por DNI (también guardado con ceros)', async () => {
    const r = await useCase.run('svc', { ...base, dni: '30111222' });
    expect(r.clienteId).toBe(CLIENTE);
  });

  it('sin cuenta de Puntos responde PUNTOS_SIN_CUENTA', async () => {
    await expect(
      useCase.run('svc', { ...base, dni: '99999999' }),
    ).rejects.toMatchObject({
      response: { code: 'PUNTOS_SIN_CUENTA' },
    });
    expect(ajuste.run).not.toHaveBeenCalled();
  });
});

describe('candidatosDni', () => {
  it('incluye sin ceros y con ceros a 10 dígitos', () => {
    expect(candidatosDni('30.111.222')).toEqual(['30111222', '0030111222']);
    expect(candidatosDni('')).toEqual([]);
  });
});
