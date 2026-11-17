import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';

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

  async run(limite: number): Promise<{ liberados: number }> {
    if (!Number.isInteger(limite) || limite <= 0) {
      return { liberados: 0 };
    }
    const liberados = await this.repository.liberarNovedadesPlex(limite);
    return { liberados };
  }
}
