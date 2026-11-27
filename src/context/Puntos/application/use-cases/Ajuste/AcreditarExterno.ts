import { Inject, Injectable } from '@nestjs/common';
import { AjusteRepository } from '@puntos/core/repository/AjusteRepository';
import { AJUSTE_REPO } from '@puntos/core/tokens/tokens';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { AjusteUseCase } from './Ajuste';

export type AcreditarExternoInput = {
  clienteId: string;
  puntos: number;
  motivo: string;
  origenTipo: string;
  claveExterna: string;
};

export type AcreditarExternoResult = {
  /** false si esa clave ya se había acreditado antes. */
  acreditado: boolean;
  ajusteId: string;
};

/**
 * Acreditación pedida por otro sistema (ej. eventos-back por la trivia).
 * Con la misma clave externa acredita una sola vez: los reintentos son seguros.
 */
@Injectable()
export class AcreditarExternoUseCase {
  constructor(
    @Inject(AJUSTE_REPO) private readonly ajusteRepo: AjusteRepository,
    private readonly ajuste: AjusteUseCase,
  ) {}

  async run(
    usuarioId: string,
    input: AcreditarExternoInput,
    ctx?: TransactionContext,
  ): Promise<AcreditarExternoResult> {
    const previo = await this.ajusteRepo.findByClaveExterna(
      input.claveExterna,
      ctx,
    );
    if (previo) return { acreditado: false, ajusteId: previo.id };

    await this.ajuste.run(
      TxTipo.ACREDITACION,
      usuarioId,
      {
        clienteId: input.clienteId,
        origenTipo: input.origenTipo,
        puntos: input.puntos,
        motivo: input.motivo,
        claveExterna: input.claveExterna,
      },
      ctx,
    );
    const creado = await this.ajusteRepo.findByClaveExterna(
      input.claveExterna,
      ctx,
    );
    return { acreditado: true, ajusteId: creado?.id ?? '' };
  }
}
