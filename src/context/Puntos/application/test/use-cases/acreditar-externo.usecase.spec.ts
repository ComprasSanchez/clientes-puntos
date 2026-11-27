/* eslint-disable @typescript-eslint/unbound-method */
import { AcreditarExternoUseCase } from '@puntos/application/use-cases/Ajuste/AcreditarExterno';
import { AjusteUseCase } from '@puntos/application/use-cases/Ajuste/Ajuste';
import { Ajuste } from '@puntos/core/entities/Ajuste';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { AjusteRepository } from '@puntos/core/repository/AjusteRepository';

const input = {
  clienteId: '00000000-0000-4000-8000-000000000001',
  puntos: 500,
  motivo: 'Trivia calendario de fin de año (7/12)',
  origenTipo: 'CALENDARIO_FIN_DE_ANIO',
  claveExterna: 'calendario:FIN_DE_ANIO_2026:2026-12-07:c1',
};

describe('AcreditarExternoUseCase', () => {
  let guardados: Ajuste[];
  let repo: jest.Mocked<AjusteRepository>;
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
      ajuste as unknown as AjusteUseCase,
    );
  });

  it('acredita con la clave externa y el motivo', async () => {
    const r = await useCase.run('svc', input);
    expect(r).toEqual({ acreditado: true, ajusteId: 'a1' });
    expect(ajuste.run).toHaveBeenCalledWith(
      TxTipo.ACREDITACION,
      'svc',
      expect.objectContaining({
        puntos: 500,
        claveExterna: input.claveExterna,
      }),
      undefined,
    );
  });

  it('con la misma clave no acredita dos veces', async () => {
    await useCase.run('svc', input);
    const segunda = await useCase.run('svc', input);
    expect(segunda).toEqual({ acreditado: false, ajusteId: 'a1' });
    expect(ajuste.run).toHaveBeenCalledTimes(1);
  });
});
