import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { NOVEDADES_PLEX_MAX_CLIENTES } from '@cliente/application/novedades-plex.config';

/**
 * Publica como novedad para Plex hasta `limite` clientes con cambios
 * pendientes (los más viejos primero). Lo que no entra queda para la próxima
 * corrida: Plex lo recibe en una consulta posterior sin tener que pedirlo.
 */
@Injectable()
export class ClienteLiberarNovedadesPlex {
  constructor(
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}

  /**
   * `sinEntregar`: publicados que Plex todavía no recibió antes de esta
   * corrida (-1 si otra réplica estaba liberando). Si llega al máximo, no se
   * libera nada hasta que Plex consulte.
   */
  async run(
    limite: number,
  ): Promise<{ liberados: number; sinEntregar: number }> {
    if (!Number.isInteger(limite) || limite <= 0) {
      return { liberados: 0, sinEntregar: 0 };
    }
    return this.repository.liberarNovedadesPlex(
      limite,
      NOVEDADES_PLEX_MAX_CLIENTES,
    );
  }
}
