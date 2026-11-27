import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { ClienteId } from '@cliente/core/value-objects/ClienteId';
import { AjusteRepository } from '@puntos/core/repository/AjusteRepository';
import { AJUSTE_REPO } from '@puntos/core/tokens/tokens';
import { TxTipo } from '@puntos/core/enums/TxTipo';
import { candidatosDni } from '@puntos/application/utils/dni-candidatos';
import { TransactionContext } from '@shared/core/interfaces/TransactionContext';
import { AjusteUseCase } from './Ajuste';

export type AcreditarExternoInput = {
  /** Cliente de Puntos; si falta o no existe, se busca por dni. */
  clienteId?: string;
  dni?: string;
  puntos: number;
  motivo: string;
  origenTipo: string;
  claveExterna: string;
};

export type AcreditarExternoResult = {
  /** false si esa clave ya se había acreditado antes. */
  acreditado: boolean;
  ajusteId: string;
  clienteId: string;
};

/**
 * Acreditación pedida por otro sistema (ej. eventos-back por la trivia).
 * Con la misma clave externa acredita una sola vez: los reintentos son seguros.
 * Si no hay cuenta de Puntos responde 404 con code PUNTOS_SIN_CUENTA.
 */
@Injectable()
export class AcreditarExternoUseCase {
  constructor(
    @Inject(AJUSTE_REPO) private readonly ajusteRepo: AjusteRepository,
    @Inject(CLIENTE_REPO) private readonly clienteRepo: ClienteRepository,
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
    if (previo) {
      return {
        acreditado: false,
        ajusteId: previo.id,
        clienteId: previo.clienteId,
      };
    }

    const clienteId = await this.resolverCliente(input);
    await this.ajuste.run(
      TxTipo.ACREDITACION,
      usuarioId,
      {
        clienteId,
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
    return { acreditado: true, ajusteId: creado?.id ?? '', clienteId };
  }

  private async resolverCliente(input: AcreditarExternoInput): Promise<string> {
    if (!input.clienteId && !input.dni) {
      throw new BadRequestException('Hace falta clienteId o dni');
    }
    if (input.clienteId) {
      const cliente = await this.clienteRepo.findById(
        new ClienteId(input.clienteId),
      );
      if (cliente) return cliente.id.value;
    }
    const candidatos = candidatosDni(input.dni);
    const porDni = candidatos.length
      ? await this.clienteRepo.findByDNICandidates(candidatos)
      : null;
    if (porDni) return porDni.id.value;
    throw new NotFoundException({
      message: 'El cliente no tiene cuenta de Puntos',
      code: 'PUNTOS_SIN_CUENTA',
    });
  }
}
